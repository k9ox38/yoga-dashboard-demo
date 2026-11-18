import { addDaysFromToday, localDate } from "../lib/dates";
import { computeMonthlyStatus } from "../lib/cardStatus";

export type ClassFormat = "团课" | "私教";
export type Level = "初级" | "中级" | "高级";
export type PackageType = "class_pack" | "pass";
export type PackageStatus = "上架中" | "已下架";
export type CardKind = "monthly" | "private";

export type PackageProduct = {
  id: string;
  code: string;
  name: string;
  type: PackageType;
  scope: "group" | "private" | "all";
  price: number;
  sessions?: number;
  validDays?: number;
  dailyLimit?: number;
  status: PackageStatus;
  createdAt: string;
};

export type CardActivity = {
  id: string;
  cardKind: CardKind;
  time: string;
  description: string;
  actor: string;
};

export type MemberCard = {
  id: string;
  packageId: string;
  remainingSessions?: number;
  totalSessions?: number;
  expireAt?: string;
  purchasedAt: string;
  activatedAt?: string;
  frozen: boolean;
  refunded: boolean;
  activities: CardActivity[];
};

export type ClassTemplate = {
  id: string;
  name: string;
  description: string;
  level: Level;
  format: ClassFormat;
  capacity: number;
};

export type ClassSession = {
  id: string;
  classId: string;
  instructor: string;
  room: string;
  date: string;
  start: string;
  end: string;
  booked: number;
  difficulty: number;
  isVisible: boolean;
};

export type Reservation = {
  id: string;
  member: string;
  memberId: string;
  sessionId: string;
  className: string;
  date: string;
  time: string;
  status: "已确认" | "已取消" | "已签到" | "未到";
  benefit: "月卡权益" | "扣次 1 次" | "无";
  bookedAt: string;
};

export type Member = {
  id: string;
  name: string;
  phone: string;
  wechat: boolean;
  monthlyStatus: "有效" | "待激活" | "即将到期" | "已到期" | "暂无月卡";
  expiry?: string;
  privateRemaining: number;
  frozen: number;
  lastClass?: string;
  joinedAt: string;
  notes: string;
  activities: MemberActivity[];
  monthlyPackageId?: string;
  monthlyPurchasedAt?: string;
  monthlyActivatedAt?: string;
  monthlyFrozen: boolean;
  monthlyRefunded: boolean;
  privatePackageId?: string;
  privatePurchasedAt?: string;
  privateActivatedAt?: string;
  privateFrozen: boolean;
  privateRefunded: boolean;
  cardActivities: CardActivity[];
  cards: MemberCard[];
};

export type MemberActivity = {
  id: string;
  time: string;
  description: string;
  actor: string;
};

export type Instructor = {
  id: string;
  name: string;
  phone: string;
  bio: string;
  status: "启用" | "禁用";
  specialty: string[];
  activities: InstructorActivity[];
};

export type InstructorActivity = {
  id: string;
  time: string;
  description: string;
  actor: string;
};


const addDays = (n: number) => addDaysFromToday(n);

export const classTemplates: ClassTemplate[] = [
  { id: "t1", name: "晨间流动", description: "动态节奏，激活全身能量，适合开启一天。", level: "中级", format: "团课", capacity: 20 },
  { id: "t2", name: "舒缓基础", description: "注重呼吸与体式对位，适合初学者入门。", level: "初级", format: "团课", capacity: 15 },
  { id: "t3", name: "深度放松", description: "慢节奏拉伸，配合引导冥想，深度修复。", level: "初级", format: "团课", capacity: 18 },
  { id: "t4", name: "进阶强化", description: "传统风格，挑战体能与专注，适合有经验学员。", level: "高级", format: "团课", capacity: 16 },
  { id: "t5", name: "空中吊绳", description: "借助吊床完成体式与倒立，增强核心与柔韧。", level: "初级", format: "团课", capacity: 10 },
  { id: "t6", name: "产前产后", description: "专为孕期与产后妈妈设计的温和练习课程。", level: "初级", format: "团课", capacity: 12 },
  { id: "t7", name: "力量塑形", description: "高强度练习，塑形与心肺并重，燃脂高效。", level: "中级", format: "团课", capacity: 22 },
  { id: "t8", name: "一对一私教", description: "根据学员目标定制的私人课程，针对性强。", level: "初级", format: "私教", capacity: 1 },
];

export const classSessions: ClassSession[] = [
  { id: "s1", classId: "t1", instructor: "吴安雅", room: "A 馆", date: addDays(0), start: "07:00", end: "08:00", booked: 18, difficulty: 3, isVisible: true  },
  { id: "s2", classId: "t2", instructor: "陈丽",   room: "B 馆", date: addDays(0), start: "09:30", end: "10:45", booked: 12, difficulty: 1, isVisible: true  },
  { id: "s3", classId: "t3", instructor: "谭美",   room: "C 馆", date: addDays(0), start: "18:30", end: "19:45", booked: 18, difficulty: 2, isVisible: true  },
  { id: "s4", classId: "t4", instructor: "拉吉",   room: "A 馆", date: addDays(1), start: "06:30", end: "08:00", booked: 9,  difficulty: 5, isVisible: true  },
  { id: "s5", classId: "t5", instructor: "苏菲娅", room: "空中阁楼", date: addDays(1), start: "19:00", end: "20:15", booked: 10, difficulty: 2, isVisible: false },
  { id: "s6", classId: "t6", instructor: "谭美",   room: "B 馆", date: addDays(2), start: "10:00", end: "11:00", booked: 6,  difficulty: 1, isVisible: true  },
  { id: "s7", classId: "t7", instructor: "吴安雅", room: "A 馆", date: addDays(2), start: "18:00", end: "19:15", booked: 20, difficulty: 4, isVisible: true  },
  { id: "s8", classId: "t3", instructor: "陈丽",   room: "C 馆", date: addDays(3), start: "20:00", end: "21:00", booked: 14, difficulty: 2, isVisible: true  },
  { id: "s9", classId: "t8", instructor: "吴安雅", room: "私教室 1", date: addDays(4), start: "14:00", end: "15:00", booked: 0, difficulty: 2, isVisible: true },
  { id: "s10", classId: "t8", instructor: "陈丽", room: "私教室 2", date: addDays(5), start: "16:30", end: "17:30", booked: 0, difficulty: 2, isVisible: true },
];

export const reservations: Reservation[] = [
  { id: "r1", member: "林晓", memberId: "M000128", sessionId: "s1", className: "晨间流动", date: addDays(0), time: "07:00", status: "已确认", benefit: "月卡权益", bookedAt: "2026-04-28 21:14" },
  { id: "r2", member: "陈悦", memberId: "M000129", sessionId: "s1", className: "晨间流动", date: addDays(0), time: "07:00", status: "已取消", benefit: "无", bookedAt: "2026-04-29 08:02" },
  { id: "r3", member: "周宁", memberId: "M000130", sessionId: "s3", className: "深度放松", date: addDays(0), time: "18:30", status: "已取消", benefit: "无", bookedAt: "2026-04-29 12:40" },
  { id: "r4", member: "许晨", memberId: "M000131", sessionId: "s5", className: "空中吊绳", date: addDays(1), time: "19:00", status: "已取消", benefit: "无", bookedAt: "2026-04-29 15:20" },
  { id: "r5", member: "苏晴", memberId: "M000132", sessionId: "s4", className: "进阶强化", date: addDays(1), time: "06:30", status: "已取消", benefit: "无", bookedAt: "2026-04-27 11:10" },
  { id: "r6", member: "赵清", memberId: "M000133", sessionId: "s2", className: "舒缓基础", date: addDays(0), time: "09:30", status: "已取消", benefit: "无", bookedAt: "2026-04-28 09:00" },
  { id: "r7", member: "王蕾", memberId: "M000134", sessionId: "s7", className: "力量塑形", date: addDays(2), time: "18:00", status: "已确认", benefit: "月卡权益", bookedAt: "2026-04-29 19:33" },
  { id: "r8", member: "李然", memberId: "M000135", sessionId: "s6", className: "产前产后", date: addDays(2), time: "10:00", status: "已取消", benefit: "无", bookedAt: "2026-04-29 20:51" },
  { id: "r9", member: "张敏", memberId: "M000136", sessionId: "s8", className: "深度放松", date: addDays(3), time: "20:00", status: "已取消", benefit: "无", bookedAt: "2026-04-30 07:08" },
  { id: "r10", member: "吴桐", memberId: "M000137", sessionId: "s2", className: "舒缓基础", date: addDays(0), time: "09:30", status: "未到", benefit: "月卡权益", bookedAt: "2026-04-28 17:25" },
];

export const packageProducts: PackageProduct[] = [
  { id: "p1", code: "PKG-0001", name: "5 节体验包", type: "class_pack", scope: "group", price: 680, sessions: 5, status: "上架中", createdAt: "2026-01-10" },
  { id: "p2", code: "PKG-0002", name: "10 节课时包", type: "class_pack", scope: "group", price: 1200, sessions: 10, status: "上架中", createdAt: "2026-01-10" },
  { id: "p3", code: "PKG-0003", name: "20 节课时包", type: "class_pack", scope: "group", price: 2200, sessions: 20, status: "上架中", createdAt: "2026-02-15" },
  { id: "p4", code: "PKG-0004", name: "月卡", type: "pass", scope: "group", price: 680, validDays: 30, dailyLimit: 1, status: "上架中", createdAt: "2026-01-10" },
  { id: "p5", code: "PKG-0005", name: "季卡", type: "pass", scope: "group", price: 1800, validDays: 90, dailyLimit: 1, status: "上架中", createdAt: "2026-03-01" },
  { id: "p6", code: "PKG-0006", name: "私教 10 次课时包", type: "class_pack", scope: "private", price: 3200, sessions: 10, status: "上架中", createdAt: "2026-03-12" },
  { id: "p7", code: "PKG-0007", name: "旧版 12 次卡", type: "class_pack", scope: "group", price: 1500, sessions: 12, status: "已下架", createdAt: "2025-08-20" },
];

type MemberSeed = Omit<Member,
  "notes" | "activities" | "monthlyPackageId" | "monthlyPurchasedAt" | "monthlyActivatedAt" |
  "monthlyFrozen" | "monthlyRefunded" | "privatePackageId" | "privatePurchasedAt" |
  "privateActivatedAt" | "privateFrozen" | "privateRefunded" | "cardActivities" | "cards" | "expiry" | "lastClass"
> & {
  /** Days from today (negative = past), so seeds never drift as the calendar moves. */
  expiryDays?: number;
  lastClassDays?: number;
};

const memberSeeds: MemberSeed[] = [
  { id: "M000128", name: "林晓", phone: "138****6201", wechat: true, monthlyStatus: "有效", expiryDays: 22, privateRemaining: 8, frozen: 1, lastClassDays: -2, joinedAt: "2026-09-18" },
  { id: "M000129", name: "陈悦", phone: "139****3816", wechat: false, monthlyStatus: "待激活", privateRemaining: 0, frozen: 0, joinedAt: "2026-10-12" },
  { id: "M000130", name: "周宁", phone: "137****9052", wechat: true, monthlyStatus: "暂无月卡", privateRemaining: 3, frozen: 2, lastClassDays: -1, joinedAt: "2026-08-06" },
  { id: "M000131", name: "许晨", phone: "136****4728", wechat: true, monthlyStatus: "已到期", expiryDays: -28, privateRemaining: 0, frozen: 0, lastClassDays: -34, joinedAt: "2026-04-21" },
  { id: "M000132", name: "苏晴", phone: "135****1839", wechat: true, monthlyStatus: "即将到期", expiryDays: 5, privateRemaining: 2, frozen: 0, lastClassDays: -3, joinedAt: "2026-07-09" },
  { id: "M000133", name: "赵清", phone: "138****7512", wechat: false, monthlyStatus: "暂无月卡", privateRemaining: 0, frozen: 0, joinedAt: "2026-10-03" },
  { id: "M000134", name: "王蕾", phone: "186****2048", wechat: true, monthlyStatus: "有效", expiryDays: 40, privateRemaining: 5, frozen: 0, lastClassDays: -4, joinedAt: "2026-03-11" },
  { id: "M000135", name: "李然", phone: "157****6093", wechat: true, monthlyStatus: "即将到期", expiryDays: 8, privateRemaining: 1, frozen: 1, lastClassDays: -6, joinedAt: "2026-06-16" },
  { id: "M000136", name: "张敏", phone: "188****3472", wechat: false, monthlyStatus: "待激活", privateRemaining: 10, frozen: 0, joinedAt: "2026-10-19" },
  { id: "M000137", name: "吴桐", phone: "152****8165", wechat: true, monthlyStatus: "有效", expiryDays: 18, privateRemaining: 4, frozen: 0, lastClassDays: -5, joinedAt: "2026-02-08" },
  { id: "M000138", name: "何静", phone: "133****4920", wechat: true, monthlyStatus: "已到期", expiryDays: -48, privateRemaining: 0, frozen: 0, lastClassDays: -52, joinedAt: "2025-12-20" },
  { id: "M000139", name: "郑妍", phone: "189****7704", wechat: false, monthlyStatus: "暂无月卡", privateRemaining: 2, frozen: 0, lastClassDays: -33, joinedAt: "2026-09-02" },
  { id: "M000140", name: "孙菲", phone: "181****3157", wechat: true, monthlyStatus: "有效", expiryDays: 55, privateRemaining: 12, frozen: 2, lastClassDays: -1, joinedAt: "2025-11-12" },
  { id: "M000141", name: "徐璐", phone: "155****6284", wechat: true, monthlyStatus: "即将到期", expiryDays: 3, privateRemaining: 0, frozen: 0, lastClassDays: -3, joinedAt: "2026-05-19" },
  { id: "M000142", name: "高悦", phone: "132****9506", wechat: false, monthlyStatus: "待激活", privateRemaining: 6, frozen: 1, joinedAt: "2026-10-22" },
  { id: "M000143", name: "唐佳", phone: "176****1049", wechat: true, monthlyStatus: "有效", expiryDays: 45, privateRemaining: 3, frozen: 0, lastClassDays: -2, joinedAt: "2026-01-14" },
  { id: "M000144", name: "沈宁", phone: "150****7361", wechat: true, monthlyStatus: "暂无月卡", privateRemaining: 8, frozen: 1, lastClassDays: -36, joinedAt: "2026-08-27" },
  { id: "M000145", name: "钱雅", phone: "139****5627", wechat: false, monthlyStatus: "已到期", expiryDays: -36, privateRemaining: 1, frozen: 0, lastClassDays: -41, joinedAt: "2025-10-30" },
  { id: "M000146", name: "宋怡", phone: "187****2398", wechat: true, monthlyStatus: "有效", expiryDays: 12, privateRemaining: 7, frozen: 0, lastClassDays: -4, joinedAt: "2026-04-05" },
  { id: "M000147", name: "冯露", phone: "134****8870", wechat: true, monthlyStatus: "即将到期", expiryDays: 6, privateRemaining: 2, frozen: 1, lastClassDays: -1, joinedAt: "2026-07-23" },
  { id: "M000148", name: "陆雪", phone: "158****4602", wechat: false, monthlyStatus: "暂无月卡", privateRemaining: 0, frozen: 0, joinedAt: "2026-10-25" },
  { id: "M000149", name: "蒋雯", phone: "153****7194", wechat: true, monthlyStatus: "有效", expiryDays: 30, privateRemaining: 5, frozen: 0, lastClassDays: -7, joinedAt: "2026-03-28" },
  { id: "M000150", name: "曹琳", phone: "180****3456", wechat: true, monthlyStatus: "待激活", privateRemaining: 0, frozen: 0, joinedAt: "2026-10-27" },
  { id: "M000151", name: "邓欣", phone: "136****9018", wechat: false, monthlyStatus: "已到期", expiryDays: -43, privateRemaining: 4, frozen: 0, lastClassDays: -45, joinedAt: "2025-09-17" },
  { id: "M000152", name: "叶青", phone: "178****5243", wechat: true, monthlyStatus: "有效", expiryDays: 62, privateRemaining: 9, frozen: 1, lastClassDays: -1, joinedAt: "2026-02-25" },
];

const seedToday = localDate();

export const members: Member[] = memberSeeds.map((seed) => {
  const intent = seed.monthlyStatus;
  const hasPassIntent = intent !== "暂无月卡";
  const awaitingActivation = intent === "待激活" || intent === "暂无月卡";
  const expiry = typeof seed.expiryDays === "number" ? addDays(seed.expiryDays) : undefined;
  const lastClass = typeof seed.lastClassDays === "number" ? addDays(seed.lastClassDays) : undefined;
  const monthlyPackageId = hasPassIntent
    ? (["M000140", "M000143", "M000152"].includes(seed.id) ? "p5" : "p4")
    : undefined;
  const monthlyPurchasedAt = intent === "暂无月卡" ? undefined : (awaitingActivation ? seedToday : seed.joinedAt);
  const monthlyActivatedAt = awaitingActivation || !hasPassIntent ? undefined : seed.joinedAt;
  const base = {
    ...seed,
    expiry,
    lastClass,
    notes: seed.id === "M000128" ? "偏好晚间课程" : "",
    activities: seed.id === "M000128" ? [
      { id: "a1", time: "2026-10-28 14:20", description: "预约私教，冻结 1 次", actor: "学员自行操作" },
      { id: "a2", time: "2026-10-10 19:05", description: "首次签到，月卡激活", actor: "管理员" },
    ] : [],
    monthlyPackageId,
    monthlyPurchasedAt,
    monthlyActivatedAt,
    monthlyFrozen: false,
    monthlyRefunded: false,
    privatePackageId: "p6",
    privatePurchasedAt: seed.privateRemaining > 0 || seed.frozen > 0 ? seed.joinedAt : seedToday,
    privateActivatedAt: seed.privateRemaining > 0 || seed.frozen > 0 ? seed.joinedAt : undefined,
    privateFrozen: false,
    privateRefunded: false,
    cardActivities: [],
    cards: [
      ...(hasPassIntent ? [{
        id: `${seed.id}-pass`,
        packageId: ["M000140", "M000143", "M000152"].includes(seed.id) ? "p5" : "p4",
        expireAt: expiry,
        purchasedAt: monthlyPurchasedAt ?? seedToday,
        activatedAt: monthlyActivatedAt,
        frozen: false,
        refunded: false,
        activities: [],
      }] : []),
      {
        id: `${seed.id}-private`,
        packageId: "p6",
        remainingSessions: seed.privateRemaining,
        totalSessions: 10,
        purchasedAt: seed.privateRemaining > 0 || seed.frozen > 0 ? seed.joinedAt : seedToday,
        activatedAt: seed.privateRemaining > 0 || seed.frozen > 0 ? seed.joinedAt : undefined,
        frozen: false,
        refunded: false,
        activities: [],
      },
    ],
  };
  const { expiryDays: _omitExpiry, lastClassDays: _omitLastClass, ...withoutOffset } = base as typeof base & { expiryDays?: number; lastClassDays?: number };
  return {
    ...withoutOffset,
    monthlyStatus: computeMonthlyStatus(withoutOffset, seedToday),
  };
});

const instructorSeeds: Array<Omit<Instructor, "activities">> = [
  { id: "i1", name: "吴安雅", phone: "138****2841", specialty: ["流瑜伽", "体能训练"],         bio: "10 年以上动态课程教学经验，擅长激励学员突破极限。",           status: "启用" },
  { id: "i2", name: "陈丽",   phone: "139****5520", specialty: ["哈他", "阴瑜伽", "基础引导"], bio: "注重体式对位与呼吸引导，尤其擅长初学者入门课程。",           status: "启用" },
  { id: "i3", name: "谭美",   phone: "186****7731", specialty: ["孕产", "冥想", "理疗"],       bio: "持证产前产后专项导师，同时提供冥想与身心恢复课程。",         status: "启用" },
  { id: "i4", name: "拉吉",   phone: "137****9902", specialty: ["阿斯汤加", "高级体式"],       bio: "传统教学风格，专注高级体式与体能强化训练。",                 status: "启用" },
  { id: "i5", name: "苏菲娅", phone: "152****3318", specialty: ["空中吊绳", "肩颈舒缓"],       bio: "舞者出身，空中吊绳课程专家，擅长柔韧与平衡训练。",           status: "禁用" },
];

export const instructors: Instructor[] = instructorSeeds.map((instructor) => ({
  ...instructor,
  activities: [
    { id: `${instructor.id}-seed`, time: "2026-10-20 10:00", description: "更新教练资料", actor: "管理员" },
  ],
}));

export const ROOMS = ["A 馆", "B 馆", "C 馆", "空中阁楼"];

export const weeklyBookings = [
  { day: "周一", bookings: 64, attended: 58 },
  { day: "周二", bookings: 72, attended: 67 },
  { day: "周三", bookings: 81, attended: 74 },
  { day: "周四", bookings: 78, attended: 70 },
  { day: "周五", bookings: 90, attended: 82 },
  { day: "周六", bookings: 112, attended: 104 },
  { day: "周日", bookings: 95, attended: 88 },
];

export const instructorSessionBreakdown = [
  { name: "吴安雅", value: 2 },
  { name: "陈丽", value: 2 },
  { name: "谭美", value: 2 },
  { name: "拉吉", value: 1 },
  { name: "苏菲娅", value: 1 },
];

/** @deprecated Prefer buildMonthlyRevenue() from lib/demoCommerce for current-month-relative charts. */
export const monthlyRevenue = [
  { month: "占位", revenue: 0 },
];
