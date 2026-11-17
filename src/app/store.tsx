import { useMemo, useState, type ReactNode } from "react";
import { StoreContext } from "./store-context";
export { useStore } from "./store-context";
import {
  classTemplates as seedT,
  classSessions as seedS,
  instructors as seedI,
  members as seedMembers,
  packageProducts as seedPackages,
  reservations as seedReservations,
  type CardKind,
  type ClassSession,
  type ClassTemplate,
  type Instructor,
  type InstructorActivity,
  type Member,
  type MemberActivity,
  type MemberCard,
  type PackageProduct,
  type Reservation,
} from "./components/data";
import { addDays, localDate } from "./lib/dates";
import { computeMonthlyStatus, isMonthlyBookable } from "./lib/cardStatus";

type ModalState =
  | { kind: "none" }
  | { kind: "class"; editing: ClassTemplate | null }
  | { kind: "session"; editing: ClassSession | null; preselect?: string; date?: string; start?: string; end?: string; instructor?: string }
  | { kind: "instructor"; editing: Instructor | null };

export type BookingEligibility = {
  ok: boolean;
  reason: string;
  benefit: Reservation["benefit"];
};

export type Store = {
  templates: ClassTemplate[];
  sessions: ClassSession[];
  instructors: Instructor[];
  members: Member[];
  reservations: Reservation[];
  packages: PackageProduct[];
  sessionCounts: Record<string, number>;
  modal: ModalState;
  openCreateClass: () => void;
  openEditClass: (t: ClassTemplate) => void;
  openCreateSession: (preselect?: string, date?: string, start?: string, end?: string, instructor?: string) => void;
  openEditSession: (s: ClassSession) => void;
  openCreateInstructor: () => void;
  openEditInstructor: (i: Instructor) => void;
  closeModal: () => void;
  submitClass: (t: ClassTemplate) => void;
  deleteClass: (id: string) => void;
  submitSession: (s: ClassSession) => void;
  deleteSession: (id: string) => void;
  submitInstructor: (i: Instructor) => void;
  deleteInstructor: (id: string) => void;
  toggleInstructorStatus: (id: string) => void;
  addMember: (member: Member) => void;
  updateMember: (id: string, changes: Partial<Member>) => void;
  addMemberActivity: (id: string, activity: Omit<MemberActivity, "id" | "time">) => void;
  addPackage: (product: Omit<PackageProduct, "id" | "code" | "createdAt">) => void;
  updatePackage: (id: string, changes: Partial<PackageProduct>) => void;
  togglePackageStatus: (id: string) => void;
  purchasePackage: (memberId: string, packageId: string, payment: string) => void;
  extendCard: (memberId: string, cardId: string, days: number) => void;
  toggleCardFreeze: (memberId: string, cardId: string) => void;
  adjustCardSessions: (memberId: string, cardId: string, delta: number, reason: string) => void;
  addReservation: (reservation: Reservation) => void;
  updateReservationStatus: (id: string, status: Reservation["status"]) => void;
  canBook: (member: Member, session: ClassSession) => BookingEligibility;
};

const createActivity = (activity: Omit<MemberActivity, "id" | "time">): MemberActivity => ({
  ...activity,
  id: crypto.randomUUID(),
  time: new Date().toLocaleString("zh-CN", { hour12: false }),
});
const createInstructorActivity = (description: string): InstructorActivity => ({
  id: crypto.randomUUID(),
  time: new Date().toLocaleString("zh-CN", { hour12: false }),
  description,
  actor: "管理员",
});
export function StoreProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<ClassTemplate[]>(seedT);
  const [sessions, setSessions] = useState<ClassSession[]>(seedS);
  const [instructors, setInstructors] = useState<Instructor[]>(seedI);
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [packages, setPackages] = useState<PackageProduct[]>(seedPackages);
  const [reservations, setReservations] = useState<Reservation[]>(seedReservations);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const sessionCounts = useMemo(() => {
    const m: Record<string, number> = {};
    sessions.forEach((s) => { m[s.classId] = (m[s.classId] ?? 0) + 1; });
    return m;
  }, [sessions]);
  const canBook = (member: Member, session: ClassSession): BookingEligibility => {
    const template = templates.find((item) => item.id === session.classId);
    if (template?.format === "私教") {
      return member.privateRemaining > 0 && !member.privateFrozen
        ? { ok: true, reason: "", benefit: "扣次 1 次" }
        : { ok: false, reason: "私教次数不足", benefit: "无" };
    }
    return isMonthlyBookable(member)
      ? { ok: true, reason: "", benefit: "月卡权益" }
      : { ok: false, reason: "无有效月卡", benefit: "无" };
  };

  const value: Store = {
    templates,
    sessions,
    instructors,
    members,
    packages,
    reservations,
    canBook,
    sessionCounts,
    modal,
    openCreateClass: () => setModal({ kind: "class", editing: null }),
    openEditClass: (t) => setModal({ kind: "class", editing: t }),
    openCreateSession: (preselect, date, start, end, instructor) => {
      if (templates.length === 0) {
        setModal({ kind: "class", editing: null });
        return;
      }
      setModal({ kind: "session", editing: null, preselect, date, start, end, instructor });
    },
    openEditSession: (s) => setModal({ kind: "session", editing: s }),
    closeModal: () => setModal({ kind: "none" }),
    submitClass: (t) =>
      setTemplates((prev) => prev.some((x) => x.id === t.id) ? prev.map((x) => x.id === t.id ? t : x) : [...prev, t]),
    deleteClass: (id) => {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setSessions((prev) => prev.filter((s) => s.classId !== id));
    },
    submitSession: (s) => {
      const isEditing = sessions.some((session) => session.id === s.id);
      setSessions((prev) => isEditing ? prev.map((session) => session.id === s.id ? s : session) : [...prev, s]);
      const className = templates.find((template) => template.id === s.classId)?.name ?? "课程";
      setInstructors((prev) => prev.map((instructor) => instructor.name === s.instructor ? {
        ...instructor,
        activities: [createInstructorActivity(`${isEditing ? "更新" : "新增"}排课：${className}`), ...instructor.activities],
      } : instructor));
    },
    deleteSession: (id) => setSessions((prev) => prev.filter((s) => s.id !== id)),
    openCreateInstructor: () => setModal({ kind: "instructor", editing: null }),
    openEditInstructor: (i) => setModal({ kind: "instructor", editing: i }),
    submitInstructor: (i) =>
      setInstructors((prev) => prev.some((x) => x.id === i.id)
        ? prev.map((x) => x.id === i.id ? { ...i, activities: [createInstructorActivity("编辑教练资料"), ...x.activities] } : x)
        : [...prev, { ...i, activities: [createInstructorActivity("新增教练档案"), ...i.activities] }]),
    deleteInstructor: (id) => setInstructors((prev) => prev.filter((x) => x.id !== id)),
    toggleInstructorStatus: (id) =>
      setInstructors((prev) => prev.map((instructor) => instructor.id === id ? {
        ...instructor,
        status: instructor.status === "启用" ? "禁用" : "启用",
        activities: [createInstructorActivity(instructor.status === "启用" ? "停用教练" : "启用教练"), ...instructor.activities],
      } : instructor)),
    addMember: (member) => setMembers((prev) => [member, ...prev]),
    updateMember: (id, changes) =>
      setMembers((prev) => prev.map((member) => member.id === id ? { ...member, ...changes } : member)),
    addMemberActivity: (id, activity) =>
      setMembers((prev) => prev.map((member) => member.id === id ? { ...member, activities: [createActivity(activity), ...member.activities] } : member)),
    addPackage: (product) => {
      const nextNumber = Math.max(0, ...packages.map((item) => Number(item.code.match(/\d+$/)?.[0] ?? 0))) + 1;
      setPackages((prev) => [...prev, {
        ...product,
        id: `p${nextNumber}`,
        code: `PKG-${String(nextNumber).padStart(4, "0")}`,
        createdAt: localDate(),
      }]);
    },
    updatePackage: (id, changes) =>
      setPackages((prev) => prev.map((product) => product.id === id ? { ...product, ...changes, id: product.id, code: product.code } : product)),
    togglePackageStatus: (id) =>
      setPackages((prev) => prev.map((product) => product.id === id ? { ...product, status: product.status === "上架中" ? "已下架" : "上架中" } : product)),
    purchasePackage: (memberId, packageId, payment) => {
      const product = packages.find((item) => item.id === packageId);
      if (!product || product.status !== "上架中") return;
      const today = localDate();
      setMembers((prev) => prev.map((member) => {
        if (member.id !== memberId) return member;
        const isPass = product.type === "pass";
        const isPrivate = product.scope === "private";
        const expiryBase = isPass && member.expiry && member.expiry > today ? member.expiry : today;
        const card: MemberCard = {
          id: `${member.id}-${product.id}-${crypto.randomUUID().slice(0, 8)}`,
          packageId: product.id,
          remainingSessions: product.type === "class_pack" ? product.sessions ?? 0 : undefined,
          totalSessions: product.type === "class_pack" ? product.sessions ?? 0 : undefined,
          expireAt: product.validDays ? addDays(expiryBase, product.validDays) : undefined,
          purchasedAt: today,
          activatedAt: today,
          frozen: false,
          refunded: false,
          activities: [],
        };
        const next = {
          ...member,
          cards: [card, ...member.cards],
          monthlyPackageId: isPass ? product.id : member.monthlyPackageId,
          monthlyPurchasedAt: isPass ? today : member.monthlyPurchasedAt,
          monthlyActivatedAt: isPass ? today : member.monthlyActivatedAt,
          expiry: isPass ? card.expireAt : member.expiry,
          monthlyFrozen: isPass ? false : member.monthlyFrozen,
          monthlyRefunded: isPass ? false : member.monthlyRefunded,
          privatePackageId: isPrivate ? product.id : member.privatePackageId,
          privatePurchasedAt: isPrivate ? today : member.privatePurchasedAt,
          privateActivatedAt: isPrivate ? today : member.privateActivatedAt,
          privateRemaining: isPrivate ? member.privateRemaining + (product.sessions ?? 0) : member.privateRemaining,
          privateFrozen: isPrivate ? false : member.privateFrozen,
          privateRefunded: isPrivate ? false : member.privateRefunded,
          activities: [createActivity({ description: `${isPass && member.monthlyStatus !== "暂无月卡" ? "续费" : "办理"}：${product.name}`, actor: `管理员 · ${payment}` }), ...member.activities],
        };
        return { ...next, monthlyStatus: computeMonthlyStatus(next, today) };
      }));
    },
    extendCard: (memberId, cardId, days) =>
      setMembers((prev) => prev.map((member) => {
        if (member.id !== memberId) return member;
        const card = member.cards.find((item) => item.id === cardId);
        if (!card) return member;
        const base = card.expireAt && card.expireAt > localDate() ? card.expireAt : localDate();
        const expireAt = addDays(base, days);
        const product = packages.find((item) => item.id === card.packageId);
        const next = {
          ...member,
          cards: member.cards.map((item) => item.id === cardId ? { ...item, expireAt, activities: [{ id: crypto.randomUUID(), cardKind: product?.type === "pass" ? "monthly" : "private" as CardKind, time: new Date().toLocaleString("zh-CN", { hour12: false }), description: `延期 ${days} 天，至 ${expireAt}`, actor: "管理员" }, ...item.activities] } : item),
          expiry: product?.type === "pass" && member.monthlyPackageId === product.id ? expireAt : member.expiry,
          activities: [createActivity({ description: `卡包延期 ${days} 天：${product?.name ?? "套餐"}`, actor: "管理员" }), ...member.activities],
        };
        return { ...next, monthlyStatus: computeMonthlyStatus(next) };
      })),
    toggleCardFreeze: (memberId, cardId) =>
      setMembers((prev) => prev.map((member) => {
        if (member.id !== memberId) return member;
        const card = member.cards.find((item) => item.id === cardId);
        if (!card) return member;
        const product = packages.find((item) => item.id === card.packageId);
        const frozen = !card.frozen;
        return {
          ...member,
          cards: member.cards.map((item) => item.id === cardId ? { ...item, frozen, activities: [{ id: crypto.randomUUID(), cardKind: product?.type === "pass" ? "monthly" : "private" as CardKind, time: new Date().toLocaleString("zh-CN", { hour12: false }), description: frozen ? "冻结卡包" : "解冻卡包", actor: "管理员" }, ...item.activities] } : item),
          monthlyFrozen: product?.type === "pass" && member.monthlyPackageId === product.id ? frozen : member.monthlyFrozen,
          privateFrozen: product?.scope === "private" && member.privatePackageId === product.id ? frozen : member.privateFrozen,
          activities: [createActivity({ description: `${frozen ? "冻结" : "解冻"}卡包：${product?.name ?? "套餐"}`, actor: "管理员" }), ...member.activities],
        };
      })),
    adjustCardSessions: (memberId, cardId, delta, reason) =>
      setMembers((prev) => prev.map((member) => {
        if (member.id !== memberId) return member;
        const card = member.cards.find((item) => item.id === cardId);
        if (!card) return member;
        const product = packages.find((item) => item.id === card.packageId);
        const before = card.remainingSessions ?? 0;
        const remainingSessions = Math.max(0, before + delta);
        const actualDelta = remainingSessions - before;
        return {
          ...member,
          cards: member.cards.map((item) => item.id === cardId ? { ...item, remainingSessions, activities: [{ id: crypto.randomUUID(), cardKind: "private", time: new Date().toLocaleString("zh-CN", { hour12: false }), description: `调整次数 ${actualDelta >= 0 ? "+" : ""}${actualDelta}：${reason}`, actor: "管理员" }, ...item.activities] } : item),
          privateRemaining: product?.scope === "private" && member.privatePackageId === product.id ? Math.max(0, member.privateRemaining + actualDelta) : member.privateRemaining,
          activities: [createActivity({ description: `调整卡包次数 ${actualDelta >= 0 ? "+" : ""}${actualDelta}：${reason}`, actor: "管理员" }), ...member.activities],
        };
      })),
    addReservation: (reservation) => {
      setReservations((prev) => [reservation, ...prev]);
      setMembers((prev) => prev.map((member) => {
        if (member.id !== reservation.memberId) return member;
        const chargedCardId = reservation.benefit === "扣次 1 次"
          ? member.cards.find((card) => card.packageId === member.privatePackageId && (card.remainingSessions ?? 0) > 0)?.id
          : undefined;
        return {
          ...member,
          privateRemaining: reservation.benefit === "扣次 1 次" ? Math.max(0, member.privateRemaining - 1) : member.privateRemaining,
          cards: chargedCardId ? member.cards.map((card) => card.id === chargedCardId ? { ...card, remainingSessions: Math.max(0, (card.remainingSessions ?? 0) - 1) } : card) : member.cards,
          activities: [createActivity({ description: `代约课程：${reservation.className}`, actor: "管理员" }), ...member.activities],
        };
      }));
    },
    updateReservationStatus: (id, status) => {
      const target = reservations.find((reservation) => reservation.id === id);
      if (target && status === "已取消" && target.status !== "已取消") {
        setMembers((current) => current.map((member) => member.id === target.memberId ? {
          ...member,
          activities: [createActivity({ description: `取消预约：${target.className}`, actor: "管理员" }), ...member.activities],
        } : member));
      }
      setReservations((prev) => prev.map((reservation) => reservation.id === id ? { ...reservation, status } : reservation));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
