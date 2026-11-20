import type { ScheduleImageItem, ScheduleImageWeek } from "./scheduleImage";

/*
 * Draws the weekly timetable onto a canvas and returns a PNG. Drawn directly rather than
 * screenshotting the page, so the picture has its own poster layout (one column per day,
 * one card per class) and comes out sharp at any screen size.
 */

const FONT_STACK = '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
const font = (weight: number, size: number) => `${weight} ${size}px ${FONT_STACK}`;

// Same colour order as the week view (emerald, blue, violet, amber, rose, teal, pink, orange).
const PALETTES = [
  { bg: "#ecfdf5", border: "#a7f3d0", bar: "#10b981", title: "#064e3b", sub: "#047857" },
  { bg: "#eff6ff", border: "#bfdbfe", bar: "#3b82f6", title: "#1e3a8a", sub: "#1d4ed8" },
  { bg: "#f5f3ff", border: "#ddd6fe", bar: "#8b5cf6", title: "#4c1d95", sub: "#6d28d9" },
  { bg: "#fffbeb", border: "#fde68a", bar: "#f59e0b", title: "#78350f", sub: "#b45309" },
  { bg: "#fff1f2", border: "#fecdd3", bar: "#f43f5e", title: "#881337", sub: "#be123c" },
  { bg: "#f0fdfa", border: "#99f6e4", bar: "#14b8a6", title: "#134e4a", sub: "#0f766e" },
  { bg: "#fdf2f8", border: "#fbcfe8", bar: "#ec4899", title: "#831843", sub: "#be185d" },
  { bg: "#fff7ed", border: "#fed7aa", bar: "#f97316", title: "#7c2d12", sub: "#c2410c" },
];

const STONE = { 100: "#f5f5f4", 200: "#e7e5e4", 400: "#a8a29e", 500: "#78716c", 600: "#57534e", 900: "#1c1917" };

const WIDTH = 1480;
const PAD = 56;
const GAP = 12;
const COL = (WIDTH - PAD * 2 - GAP * 6) / 7;
const HEADER_H = 128;
const DAY_H = 60;
const CARD_H = 124;
const CARD_GAP = 10;
// Safari refuses canvases above about 16.7 million pixels.
const MAX_PIXELS = 16_000_000;

type Ctx = CanvasRenderingContext2D;

function roundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shortens text with an ellipsis so it fits the given width. */
function fit(ctx: Ctx, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > max) end--;
  return `${text.slice(0, end)}…`;
}

function text(ctx: Ctx, value: string, x: number, y: number, style: { font: string; color: string; align?: CanvasTextAlign; max?: number }) {
  ctx.font = style.font;
  ctx.fillStyle = style.color;
  ctx.textAlign = style.align ?? "left";
  ctx.fillText(style.max ? fit(ctx, value, style.max) : value, x, y);
}

function drawBrand(ctx: Ctx, brand: string, right: number, centerY: number) {
  ctx.font = font(600, 17);
  const nameWidth = ctx.measureText(brand).width;
  const cx = right - nameWidth - 12 - 18;
  const gradient = ctx.createLinearGradient(cx - 18, centerY - 18, cx + 18, centerY + 18);
  gradient.addColorStop(0, "#34d399");
  gradient.addColorStop(1, "#0d9488");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, centerY, 18, 0, Math.PI * 2);
  ctx.fill();
  // A small five-petal flower, standing in for the app's logo.
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * 6, centerY + Math.sin(angle) * 6, 4.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#0f766e";
  ctx.beginPath();
  ctx.arc(cx, centerY, 2.6, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, brand, right, centerY, { font: font(600, 17), color: STONE[900], align: "right" });
}

function drawCard(ctx: Ctx, item: ScheduleImageItem, x: number, y: number) {
  const palette = PALETTES[item.palette % PALETTES.length];
  roundedRect(ctx, x, y, COL, CARD_H, 12);
  ctx.fillStyle = palette.bg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = palette.bar;
  ctx.fillRect(x, y, 4, CARD_H);
  ctx.restore();
  roundedRect(ctx, x + 0.5, y + 0.5, COL - 1, CARD_H - 1, 12);
  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  const left = x + 16;
  const inner = COL - 16 - 12;
  text(ctx, `${item.start} – ${item.end}`, left, y + 14, { font: font(600, 14), color: palette.sub, max: inner });
  text(ctx, item.name, left, y + 38, { font: font(700, 18), color: palette.title, max: inner });
  text(ctx, [item.instructor, item.room].filter(Boolean).join(" · "), left, y + 66, { font: font(400, 13), color: STONE[600], max: inner });

  const full = item.capacity > 0 && item.booked >= item.capacity;
  const seats = full ? "已满" : item.capacity ? `已约 ${item.booked}/${item.capacity}` : "";
  ctx.font = font(full ? 600 : 400, 12);
  const seatsWidth = seats ? ctx.measureText(seats).width + 8 : 0;
  text(ctx, [item.format, item.difficulty].filter(Boolean).join(" · "), left, y + 96, { font: font(500, 12), color: palette.sub, max: inner - seatsWidth });
  if (seats) text(ctx, seats, x + COL - 12, y + 96, { font: font(full ? 600 : 400, 12), color: full ? "#e11d48" : STONE[500], align: "right" });
}

function drawEmptyDay(ctx: Ctx, x: number, y: number) {
  roundedRect(ctx, x + 0.5, y + 0.5, COL - 1, CARD_H - 1, 12);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = STONE[200];
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.textBaseline = "middle";
  text(ctx, "暂无课程", x + COL / 2, y + CARD_H / 2, { font: font(400, 14), color: STONE[400], align: "center" });
  ctx.textBaseline = "top";
}

/**
 * Waits briefly for the page's Chinese web font, so the picture doesn't switch fonts mid-draw.
 * Where the font can't be fetched (Google Fonts is often unreachable), the system font is used
 * straight away rather than after a long wait.
 */
async function loadFonts(sample: string) {
  if (typeof document === "undefined" || !document.fonts) return;
  const faces = Array.from(document.fonts).filter((face) => face.family.replace(/["']/g, "") === "Noto Sans SC");
  if (!faces.length || faces.every((face) => face.status === "error")) return;
  const loads = [400, 500, 600, 700].map((weight) => document.fonts.load(font(weight, 16), sample));
  await Promise.race([Promise.allSettled(loads), new Promise((resolve) => setTimeout(resolve, 1200))]);
}

export async function renderScheduleImage(
  week: ScheduleImageWeek,
  { brand, generatedAt }: { brand: string; generatedAt: string },
): Promise<{ blob: Blob; width: number; height: number }> {
  const rows = Math.max(1, ...week.days.map((day) => day.items.length));
  const gridTop = PAD + HEADER_H;
  const cardsTop = gridTop + DAY_H + 12;
  const gridBottom = cardsTop + rows * CARD_H + (rows - 1) * CARD_GAP;
  const footerTop = gridBottom + 36;
  const height = Math.ceil(footerTop + 18 + 18 + 40);

  const strings = [brand, "课程表", week.rangeLabel, generatedAt, "生成于课程安排以小程序实时信息为准共节已满约暂无0123456789/–·…",
    ...week.days.flatMap((day) => [day.weekday, ...day.items.flatMap((item) => [item.name, item.instructor, item.room, item.format, item.difficulty])])].join("");
  await loadFonts(strings);

  let scale = 2;
  while (scale > 1 && WIDTH * scale * height * scale > MAX_PIXELS) scale -= 0.25;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(WIDTH * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);

  // Header: title and week on the left, studio and class count on the right.
  text(ctx, "课程表", PAD, PAD, { font: font(700, 40), color: STONE[900] });
  text(ctx, week.rangeLabel, PAD, PAD + 60, { font: font(400, 18), color: STONE[500] });
  ctx.textBaseline = "middle";
  drawBrand(ctx, brand, WIDTH - PAD, PAD + 20);
  ctx.textBaseline = "top";
  text(ctx, `共 ${week.total} 节课`, WIDTH - PAD, PAD + 62, { font: font(400, 16), color: STONE[500], align: "right" });

  week.days.forEach((day, index) => {
    const x = PAD + index * (COL + GAP);
    roundedRect(ctx, x, gridTop, COL, DAY_H, 12);
    ctx.fillStyle = STONE[100];
    ctx.fill();
    text(ctx, day.weekday, x + COL / 2, gridTop + 10, { font: font(700, 18), color: STONE[900], align: "center" });
    text(ctx, day.label, x + COL / 2, gridTop + 36, { font: font(400, 13), color: STONE[500], align: "center" });

    if (!day.items.length) drawEmptyDay(ctx, x, cardsTop);
    day.items.forEach((item, row) => drawCard(ctx, item, x, cardsTop + row * (CARD_H + CARD_GAP)));
  });

  ctx.fillStyle = STONE[200];
  ctx.fillRect(PAD, footerTop, WIDTH - PAD * 2, 1);
  text(ctx, `生成于 ${generatedAt}`, PAD, footerTop + 18, { font: font(400, 13), color: STONE[400] });
  text(ctx, "课程安排以小程序实时信息为准", WIDTH - PAD, footerTop + 18, { font: font(400, 13), color: STONE[400], align: "right" });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("could not encode PNG");
  return { blob, width: canvas.width, height: canvas.height };
}
