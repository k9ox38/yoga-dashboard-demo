import { useEffect, useState } from "react";
import { AlertCircle, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { renderScheduleImage } from "../lib/renderScheduleImage";
import { scheduleImageFilename, type ScheduleImageWeek } from "../lib/scheduleImage";
import { localDateTime } from "../lib/dates";
import { downloadBlob } from "../lib/download";

type Image = { blob: Blob; url: string };

/** Previews the week's timetable as a picture and saves it as a PNG. */
export function ScheduleExportDialog({ open, onOpenChange, week }: { open: boolean; onOpenChange: (open: boolean) => void; week: ScheduleImageWeek }) {
  const [image, setImage] = useState<Image | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let url = "";
    setImage(null);
    setFailed(false);
    renderScheduleImage(week, { brand: "瑜伽管理演示", generatedAt: localDateTime().slice(0, 16) })
      .then(({ blob }) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, week]);

  const save = () => {
    if (!image) return;
    downloadBlob(scheduleImageFilename(week), image.blob);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-stone-200 bg-white p-0 sm:max-w-3xl">
        <div className="border-b border-stone-100 px-5 py-4 pr-12 sm:px-6">
          <DialogTitle className="text-base font-semibold text-stone-900">导出课程表</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-stone-500">
            {week.rangeLabel} · {week.total} 节课
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-stone-100 p-3 sm:p-4">
          {image ? (
            <img src={image.url} alt={`课程表 ${week.rangeLabel}`} className="mx-auto block w-full rounded-lg shadow-sm ring-1 ring-stone-200" />
          ) : failed ? (
            <div role="alert" className="flex h-48 flex-col items-center justify-center gap-2 text-sm text-rose-600">
              <AlertCircle className="size-5" />生成图片失败，请关闭后重试。
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center gap-2 text-sm text-stone-500" aria-live="polite">
              <Loader2 className="size-4 animate-spin" />正在生成图片…
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs leading-5 text-stone-500">
            {week.hidden > 0 && <>已隐藏的 {week.hidden} 节课不会出现在图片中。</>}
            <span className="hidden pointer-coarse:inline">在手机上也可以长按图片保存。</span>
          </p>
          <div className="flex shrink-0 justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="h-9 rounded-lg border border-stone-200 px-4 text-sm font-normal text-stone-700 hover:bg-stone-50">
              取消
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!image}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="size-4" />下载图片
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
