import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Info, LockKeyhole, Package as PackageIcon, Plus, Search, X } from "lucide-react";
import { useStore } from "../store-context";
import type { Member, MemberCard, PackageProduct, PackageStatus, PackageType } from "./data";
import { localDate } from "../lib/dates";
import { computePackCardStatus, type PackCardStatus } from "../lib/cardStatus";
import { SelectMenu } from "./SelectMenu";

type CardStatus = PackCardStatus;
type UserCard = MemberCard & { memberId: string; memberName: string; memberPhone: string; product: PackageProduct };
type CardAction = { card: UserCard; kind: "extend" | "adjust" };

const cardClass = "rounded-xl border border-stone-200 bg-white";
const inputClass = "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:cursor-default disabled:bg-stone-50 disabled:text-stone-600";
const primaryClass = "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50";
const secondaryClass = "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50";
const typeLabel: Record<PackageType, string> = { class_pack: "课时包", pass: "月卡 / 季卡" };

const today = () => localDate();

function cardStatus(card: MemberCard, product: PackageProduct): CardStatus {
  return computePackCardStatus(card, product, today());
}

function flattenCards(members: Member[], products: PackageProduct[]): UserCard[] {
  return members.flatMap((member) => member.cards.flatMap((card) => {
    const product = products.find((item) => item.id === card.packageId);
    return product ? [{ ...card, memberId: member.id, memberName: member.name, memberPhone: member.phone, product }] : [];
  }));
}

function benefitLines(product: PackageProduct) {
  if (product.type === "pass") return [`${product.name === "月卡" ? "1 个自然月" : `${product.validDays ?? 0} 天`} · 每天最多 ${product.dailyLimit ?? 1} 节`, `有效期 ${product.validDays ?? 0} 天`];
  return [`${product.sessions ?? 0} 节`, product.validDays ? `有效期 ${product.validDays} 天` : "无有效期"];
}

export function Packages() {
  const navigate = useNavigate();
  const { packages, members } = useStore();
  const [tab, setTab] = useState<"products" | "cards">("products");
  const cards = useMemo(() => flattenCards(members, packages), [members, packages]);
  const stats = [
    { label: "全部套餐", value: packages.length, icon: PackageIcon, tone: "bg-emerald-50 text-emerald-700" },
    { label: "上架中", value: packages.filter((item) => item.status === "上架中").length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "已下架", value: packages.filter((item) => item.status === "已下架").length, icon: CircleDollarSign, tone: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="min-h-full bg-[#f4f7f4] p-4 text-stone-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold text-stone-950">套餐管理</h1><p className="mt-1 text-sm text-stone-500">维护线下售卡套餐与价格</p></div>
          <button onClick={() => navigate("/packages/new")} className={primaryClass}><Plus className="size-4" />新增套餐</button>
        </div>
        <InfoBar>管理员开卡时选择套餐，系统生成对应会员卡。</InfoBar>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className={`${cardClass} flex min-w-0 flex-col items-start gap-2 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-5`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full sm:size-12 ${tone}`}><Icon className="size-4 sm:size-5" /></span><div className="min-w-0"><div className="text-sm text-stone-500">{label}</div><div className="mt-1 text-2xl font-semibold tabular-nums text-stone-950">{value}</div></div></div>)}
        </div>
        <div className="flex gap-7 border-b border-stone-200">
          {(["products", "cards"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`-mb-px border-b-2 px-1 py-3 text-sm font-medium ${tab === item ? "border-emerald-700 text-emerald-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>{item === "products" ? "套餐产品" : "用户卡包"}</button>)}
        </div>
        {tab === "products" ? <ProductsTab /> : <CardsTab cards={cards} members={members} />}
      </div>
    </div>
  );
}

function ProductsTab() {
  const navigate = useNavigate();
  const { packages, togglePackageStatus } = useStore();
  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [filters, setFilters] = useState({ keyword: "", type: "", status: "" });
  const [confirming, setConfirming] = useState<PackageProduct | null>(null);
  const [notice, setNotice] = useState("");
  const filtered = packages.filter((item) => (!filters.keyword || item.name.includes(filters.keyword)) && (!filters.type || item.type === filters.type) && (!filters.status || item.status === filters.status));
  const reset = () => { setDraftKeyword(""); setDraftType(""); setDraftStatus(""); setFilters({ keyword: "", type: "", status: "" }); };
  const toggle = (product: PackageProduct) => {
    if (product.status === "上架中") return setConfirming(product);
    togglePackageStatus(product.id);
    setNotice(`套餐「${product.name}」已上架。`);
  };

  return <div className="space-y-4">
    {notice && <Notice>{notice}</Notice>}
    <div className={`${cardClass} flex flex-wrap items-end gap-4 p-4 xl:flex-nowrap`}>
      <label className="min-w-[220px] flex-1"><span className="mb-1.5 block text-xs text-stone-600">套餐名称</span><span className="relative block"><Search className="absolute left-3 top-3 size-4 text-stone-400" /><input value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} placeholder="搜索套餐名称" className={`${inputClass} pl-9`} /></span></label>
      <label className="w-full sm:w-52"><span className="mb-1.5 block text-xs text-stone-600">类型：</span><SimpleSelect value={draftType} onChange={setDraftType} ariaLabel="套餐类型" options={[["", "全部类型"], ["class_pack", "课时包"], ["pass", "月卡 / 季卡"]]} /></label>
      <label className="w-full sm:w-48"><span className="mb-1.5 block text-xs text-stone-600">状态：</span><SimpleSelect value={draftStatus} onChange={setDraftStatus} ariaLabel="套餐状态" options={[["", "全部状态"], ["上架中", "上架中"], ["已下架", "已下架"]]} /></label>
      <div className="ml-auto flex shrink-0 gap-2"><button onClick={() => setFilters({ keyword: draftKeyword.trim(), type: draftType, status: draftStatus })} className={primaryClass}>查询</button><button onClick={reset} className={secondaryClass}>重置</button></div>
    </div>
    <section className={`${cardClass} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4"><h2 className="font-semibold text-stone-900">套餐列表</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-stone-50 text-stone-600"><tr>{["套餐名称", "类型", "套餐权益", "售价", "状态", "操作"].map((item) => <th key={item} className="px-5 py-3 font-medium">{item}</th>)}</tr></thead>
          <tbody>{filtered.map((product) => {
            const [benefit, validity] = benefitLines(product);
            return <tr key={product.id} className="h-16 border-t border-stone-100 hover:bg-stone-50/70">
              <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CreditCard className="size-4" /></span><div><div className="font-semibold text-stone-900">{product.name}</div><div className="mt-0.5 font-mono text-xs text-stone-400">{product.code}</div></div></div></td>
              <td className="px-5"><Badge className={product.type === "class_pack" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}>{typeLabel[product.type]}</Badge></td>
              <td className="px-5"><div className="text-stone-800">{benefit}</div><div className="mt-0.5 text-xs text-stone-400">{validity}</div></td>
              <td className="px-5 font-semibold text-stone-900">{product.price.toLocaleString()}元</td>
              <td className="px-5"><Badge className={product.status === "上架中" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}>{product.status}</Badge></td>
              <td className="px-5"><TextActions actions={[["查看", () => navigate(`/packages/${product.id}`)], ["编辑", () => navigate(`/packages/${product.id}/edit`)], [product.status === "上架中" ? "下架" : "上架", () => toggle(product)]]} /></td>
            </tr>;
          })}</tbody>
        </table>
        {!filtered.length && <div className="py-16 text-center text-sm text-stone-500">没有符合条件的套餐</div>}
      </div>
      <div className="border-t border-stone-100 px-5 py-3 text-xs text-stone-500">共 {filtered.length} 个套餐。</div>
    </section>
    {confirming && <ConfirmModal title="确认下架套餐" onClose={() => setConfirming(null)} onConfirm={() => { togglePackageStatus(confirming.id); setNotice(`套餐「${confirming.name}」已下架。`); setConfirming(null); }}>下架后会员将无法购买此套餐，已购卡包不受影响。</ConfirmModal>}
  </div>;
}

function CardsTab({ cards, members }: { cards: UserCard[]; members: Member[] }) {
  const { extendCard, toggleCardFreeze, adjustCardSessions } = useStore();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Member | null>(null);
  const [action, setAction] = useState<CardAction | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<UserCard | null>(null);
  const [notice, setNotice] = useState("");
  const filteredMembers = members.filter((member) => member.name.includes(keyword) || member.phone.includes(keyword));
  const pages = Math.max(1, Math.ceil(filteredMembers.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filteredMembers.slice((currentPage - 1) * 10, currentPage * 10);
  const cardsFor = (memberId: string) => cards.filter((card) => card.memberId === memberId).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const completeAction = (value: number, reason: string) => {
    if (!action) return;
    if (action.kind === "extend") extendCard(action.card.memberId, action.card.id, value);
    else adjustCardSessions(action.card.memberId, action.card.id, value, reason);
    setNotice(action.kind === "extend" ? `卡包已延期 ${value} 天。` : `卡包次数已调整 ${value >= 0 ? "+" : ""}${value}。`);
    setAction(null);
  };
  const freeze = (card: UserCard) => {
    if (card.frozen) {
      toggleCardFreeze(card.memberId, card.id);
      setNotice(`${card.memberName} 的${card.product.name}已解冻。`);
    } else setFreezeTarget(card);
    setMenuId(null);
  };

  return <div className="space-y-4">
    {notice && <Notice>{notice}</Notice>}
    <div className={`${cardClass} flex items-end gap-3 p-4`}><label className="w-full max-w-sm"><span className="mb-1.5 block text-xs text-stone-600">会员</span><span className="relative block"><Search className="absolute left-3 top-3 size-4 text-stone-400" /><input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} placeholder="搜索会员姓名或手机号" className={`${inputClass} pl-9`} /></span></label></div>
    <section className={`${cardClass} overflow-visible`}>
      <div className="border-b border-stone-200 px-5 py-4"><h2 className="font-semibold text-stone-900">用户卡包</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-stone-50 text-stone-600"><tr>{["会员", "月卡 / 季卡", "私教课时", "最近购买", "操作"].map((item) => <th key={item} className="px-5 py-3 font-medium">{item}</th>)}</tr></thead>
          <tbody>{visible.map((member) => {
            const memberCards = cardsFor(member.id);
            const pass = memberCards.find((card) => card.product.type === "pass");
            const privateCard = memberCards.find((card) => card.product.scope === "private");
            const activeCard = memberCards.find((card) => cardStatus(card, card.product) === "生效中");
            const extensionCard = pass && cardStatus(pass, pass.product) === "生效中" ? pass : undefined;
            return <tr key={member.id} className="h-16 border-t border-stone-100 hover:bg-stone-50/70">
              <td className="px-5"><div className="font-semibold text-stone-900">{member.name}</div><div className="mt-0.5 text-xs text-stone-400">{member.phone}</div></td>
              <td className="px-5">{pass ? <CardCell card={pass} /> : <span className="text-stone-400">—</span>}</td>
              <td className="px-5">{privateCard ? <CardCell card={privateCard} /> : <span className="text-stone-400">—</span>}</td>
              <td className="px-5 text-stone-600">{memberCards[0]?.purchasedAt ?? "—"}</td>
              <td className="relative px-5"><TextActions actions={[["详情", () => setDetail(member)], ["更多", () => setMenuId(menuId === member.id ? null : member.id)]]} />
                {menuId === member.id && <><button className="fixed inset-0 z-10 cursor-default" aria-label="关闭菜单" onClick={() => setMenuId(null)} /><div className="absolute right-5 top-12 z-20 w-36 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">
                  {extensionCard && <MenuButton onClick={() => { setAction({ card: extensionCard, kind: "extend" }); setMenuId(null); }}>延期</MenuButton>}
                  {activeCard && <MenuButton onClick={() => freeze(activeCard)}>{activeCard.frozen ? "解冻" : "冻结"}</MenuButton>}
                  {privateCard && <MenuButton onClick={() => { setAction({ card: privateCard, kind: "adjust" }); setMenuId(null); }}>调整次数</MenuButton>}
                  {!extensionCard && !activeCard && !privateCard && <div className="px-3 py-2 text-xs text-stone-400">暂无可用操作</div>}
                </div></>}
              </td>
            </tr>;
          })}</tbody>
        </table>
        {!visible.length && <div className="py-16 text-center text-sm text-stone-500">没有符合条件的会员卡包</div>}
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3"><span className="text-xs text-stone-500">共 {filteredMembers.length} 位会员</span><div className="flex items-center gap-2"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="flex size-8 items-center justify-center rounded-lg border border-stone-200 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="text-xs text-stone-500">{currentPage} / {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} className="flex size-8 items-center justify-center rounded-lg border border-stone-200 disabled:opacity-40"><ChevronRight className="size-4" /></button></div></div>
    </section>
    {detail && <MemberCardsModal member={detail} cards={cardsFor(detail.id)} onClose={() => setDetail(null)} />}
    {action && <CardActionModal action={action} onClose={() => setAction(null)} onSubmit={completeAction} />}
    {freezeTarget && <ConfirmModal title="确认冻结卡包" onClose={() => setFreezeTarget(null)} onConfirm={() => { toggleCardFreeze(freezeTarget.memberId, freezeTarget.id); setNotice(`${freezeTarget.memberName} 的${freezeTarget.product.name}已冻结。`); setFreezeTarget(null); }}>冻结后该卡包将暂时无法用于预约，确认继续吗？</ConfirmModal>}
  </div>;
}

function CardCell({ card }: { card: UserCard }) {
  const status = cardStatus(card, card.product);
  const detail = card.product.type === "pass" ? (card.expireAt ? `至 ${card.expireAt}` : "购买后待激活") : `${card.remainingSessions ?? 0} 次可用`;
  return <div><div className="flex items-center gap-2"><span className="font-medium text-stone-800">{card.product.name}</span><Badge className={status === "生效中" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}>{card.frozen ? "已冻结" : status}</Badge></div><div className="mt-0.5 text-xs text-stone-400">{detail}</div></div>;
}

export function PackageEditor({ readOnly = false }: { readOnly?: boolean }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { packages, members, addPackage, updatePackage } = useStore();
  const initial = packages.find((item) => item.id === id) ?? null;
  const isNew = !id;
  const hasSales = initial ? members.some((member) => member.cards.some((card) => card.packageId === initial.id)) : false;
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<PackageType>(initial?.type ?? "class_pack");
  const [scope, setScope] = useState<PackageProduct["scope"]>(initial?.scope ?? "group");
  const [price, setPrice] = useState(initial?.price ?? 680);
  const [sessions, setSessions] = useState(initial?.sessions ?? 5);
  const [validDays, setValidDays] = useState(initial?.validDays ?? 30);
  const [dailyLimit, setDailyLimit] = useState(initial?.dailyLimit ?? 1);
  const [status, setStatus] = useState<PackageStatus>(initial?.status ?? "上架中");
  const [description, setDescription] = useState(initial ? `${initial.name}线下开卡套餐` : "");
  const [error, setError] = useState("");
  const displayValue = type === "class_pack" ? `${sessions} 次` : `${validDays} 天`;
  const reference = type === "class_pack" && sessions > 0 ? `${Math.round(price / sessions)} 元 / 次` : "按有效期使用";
  const save = () => {
    if (!name.trim() || price <= 0 || (type === "class_pack" ? sessions < 1 : validDays < 1)) return setError("请完整填写必填信息。");
    const value = { name: name.trim(), type, scope: type === "pass" ? "group" as const : scope, price, sessions: type === "class_pack" ? sessions : undefined, validDays: type === "pass" ? validDays : undefined, dailyLimit: type === "pass" ? dailyLimit : undefined, status };
    if (initial) updatePackage(initial.id, value); else addPackage(value);
    navigate("/packages");
  };
  if (!isNew && !initial) return <div className="p-8 text-sm text-stone-500">未找到该套餐。</div>;

  return <div className="min-h-full bg-[#f4f7f4] pb-24 text-sm text-stone-800">
    <div className="mx-auto max-w-[1280px] space-y-5 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-sm text-stone-500"><button onClick={() => navigate("/packages")} className="hover:text-emerald-700">套餐管理</button><span>/</span><span>{readOnly ? "查看套餐" : isNew ? "新增套餐" : "编辑套餐"}</span></div><h1 className="text-2xl font-semibold text-stone-950">{readOnly ? "查看套餐" : isNew ? "新增套餐" : "编辑套餐"}</h1><p className="mt-1 text-sm text-stone-500">{initial ? `${initial.name} · ${initial.code}` : "创建新的线下售卡套餐"}</p></div>{readOnly && initial && <button onClick={() => navigate(`/packages/${initial.id}/edit`)} className={primaryClass}>编辑</button>}</div>
      {!isNew && !readOnly && <InfoBar>修改仅影响后续购卡，不改变已售会员卡</InfoBar>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="space-y-5">
          <FormCard title="基本信息">
            <Field label="套餐名称 *"><input disabled={readOnly} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></Field>
            <Field label="套餐类型 *">{hasSales || readOnly ? <div className="flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-stone-100 px-3 text-stone-500"><LockKeyhole className="size-4" />{typeLabel[type]}</div> : <div className="grid grid-cols-2 gap-2"><Choice active={type === "class_pack"} onClick={() => setType("class_pack")}>课时包</Choice><Choice active={type === "pass"} onClick={() => setType("pass")}>月卡 / 季卡</Choice></div>}{hasSales && <div className="mt-1.5 text-xs text-stone-400">已售套餐类型不可修改</div>}</Field>
            {type === "class_pack" && !readOnly && <Field label="适用课程"><SimpleSelect value={scope} onChange={(value) => setScope(value as PackageProduct["scope"])} ariaLabel="适用课程" options={[["group", "小班课"], ["private", "私教课"], ["all", "全部课程"]]} /></Field>}
            <Field label="售价（元）*"><input disabled={readOnly} type="number" min={1} value={price} onChange={(event) => setPrice(Number(event.target.value))} className={inputClass} /></Field>
            <Field label="套餐说明"><textarea disabled={readOnly} value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 w-full rounded-lg border border-stone-200 bg-white p-3 text-sm outline-none focus:border-emerald-700 disabled:bg-stone-50" placeholder="填写套餐适用人群和售卖说明" /></Field>
          </FormCard>
          <FormCard title="套餐权益">
            {type === "class_pack" ? <Field label="购买次数"><div className="inline-flex h-11 items-center overflow-hidden rounded-lg border border-stone-200 bg-white"><button disabled={readOnly || sessions <= 1} onClick={() => setSessions(Math.max(1, sessions - 1))} className="h-full w-11 text-lg text-stone-500 hover:bg-stone-50 disabled:opacity-40">−</button><span className="w-16 text-center text-base font-semibold tabular-nums">{sessions}</span><button disabled={readOnly} onClick={() => setSessions(sessions + 1)} className="h-full w-11 text-lg text-stone-500 hover:bg-stone-50 disabled:opacity-40">+</button></div></Field> : <div className="grid gap-4 sm:grid-cols-2"><Field label="有效天数"><input disabled={readOnly} type="number" min={1} value={validDays} onChange={(event) => setValidDays(Number(event.target.value))} className={inputClass} /></Field><Field label="每日预约上限"><input disabled={readOnly} type="number" min={1} value={dailyLimit} onChange={(event) => setDailyLimit(Number(event.target.value))} className={inputClass} /></Field></div>}
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">{type === "class_pack" ? "预约时冻结次数，完成上课后扣次；取消或缺席不扣次。" : "在有效期内按每日预约上限使用小班课权益。"}</div>
            <Field label="状态"><div className="grid max-w-sm grid-cols-2 gap-2"><Choice disabled={readOnly} active={status === "上架中"} onClick={() => setStatus("上架中")}>上架</Choice><Choice disabled={readOnly} active={status === "已下架"} onClick={() => setStatus("已下架")}>下架</Choice></div></Field>
          </FormCard>
          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
        <aside className={`${cardClass} sticky top-5 overflow-hidden`}>
          <div className="border-b border-stone-200 px-5 py-4 font-semibold text-stone-900">开卡权益预览</div>
          <div className="m-5 rounded-xl bg-emerald-50 p-6"><div className="flex size-11 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm"><CalendarDays className="size-5" /></div><div className="mt-6 text-sm text-emerald-800">{name || "套餐名称"}</div><div className="mt-2 text-4xl font-semibold text-emerald-950">{displayValue}</div><div className="mt-3 text-sm text-emerald-700">{typeLabel[type]} · {type === "class_pack" ? "无有效期" : `有效期 ${validDays} 天`}</div><div className="my-6 border-t border-emerald-200" /><div className="flex items-end justify-between"><div><div className="text-xs text-emerald-700">套餐售价</div><div className="mt-1 text-2xl font-semibold text-emerald-950">{price.toLocaleString()}元</div></div><div className="text-right"><div className="text-xs text-emerald-700">参考单价</div><div className="mt-1 font-medium text-emerald-950">{reference}</div></div></div></div>
        </aside>
      </div>
    </div>
    <div className="fixed bottom-0 right-0 left-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 sm:px-6 lg:left-56 shadow-[0_-4px_18px_rgba(0,0,0,0.04)] backdrop-blur"><div className="mx-auto flex max-w-[1280px] justify-end gap-3"><button onClick={() => navigate("/packages")} className={secondaryClass}>{readOnly ? "返回" : "取消"}</button>{!readOnly && <button onClick={save} className={primaryClass}>{isNew ? "创建套餐" : "保存修改"}</button>}</div></div>
  </div>;
}

function MemberCardsModal({ member, cards, onClose }: { member: Member; cards: UserCard[]; onClose: () => void }) {
  return <Modal title="会员卡包详情" subtitle={`${member.name} · ${member.phone}`} onClose={onClose}><div className="space-y-3 p-5">{cards.map((card) => <div key={card.id} className="rounded-lg border border-stone-200 p-4"><div className="flex items-center justify-between"><div className="font-medium text-stone-900">{card.product.name}</div><Badge className="bg-stone-100 text-stone-600">{card.frozen ? "已冻结" : cardStatus(card, card.product)}</Badge></div><div className="mt-2 text-xs text-stone-500">{card.product.code} · 购买于 {card.purchasedAt}</div></div>)}</div></Modal>;
}

function CardActionModal({ action, onClose, onSubmit }: { action: CardAction; onClose: () => void; onSubmit: (value: number, reason: string) => void }) {
  const [days, setDays] = useState("7");
  const [direction, setDirection] = useState("增加");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const submit = () => { if (action.kind === "adjust" && !reason.trim()) return; onSubmit(action.kind === "extend" ? Number(days) : direction === "增加" ? amount : -amount, reason); };
  return <Modal title={action.kind === "extend" ? "延期卡包" : "调整次数"} subtitle={`${action.card.memberName} · ${action.card.product.name}`} onClose={onClose}><div className="space-y-4 p-5">{action.kind === "extend" ? <Field label="延期时长"><SimpleSelect value={days} onChange={setDays} ariaLabel="延期时长" options={[["7", "+7 天"], ["15", "+15 天"], ["30", "+30 天"]]} /></Field> : <><div className="grid grid-cols-2 gap-4"><Field label="调整方式"><SimpleSelect value={direction} onChange={setDirection} ariaLabel="调整方式" options={[["增加", "增加"], ["减少", "减少"]]} /></Field><Field label="调整次数"><input type="number" min={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className={inputClass} /></Field></div><Field label="调整原因"><textarea value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-20 w-full rounded-lg border border-stone-200 p-3 text-sm outline-none focus:border-emerald-700" /></Field></>}</div><ModalFooter onClose={onClose} onConfirm={submit} label="确认操作" /></Modal>;
}

function ConfirmModal({ title, children, onClose, onConfirm }: { title: string; children: ReactNode; onClose: () => void; onConfirm: () => void }) {
  return <Modal title={title} onClose={onClose}><div className="p-5"><div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">{children}</div></div><ModalFooter onClose={onClose} onConfirm={onConfirm} label="确认" /></Modal>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between border-b border-stone-200 px-5 py-4"><div><div className="font-semibold text-stone-900">{title}</div>{subtitle && <div className="mt-1 text-xs text-stone-500">{subtitle}</div>}</div><button onClick={onClose} aria-label="关闭" className="flex size-8 items-center justify-center rounded-lg hover:bg-stone-100"><X className="size-4" /></button></div>{children}</div></div>;
}
function ModalFooter({ onClose, onConfirm, label }: { onClose: () => void; onConfirm: () => void; label: string }) { return <div className="flex justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3"><button onClick={onClose} className={secondaryClass}>取消</button><button onClick={onConfirm} className={primaryClass}>{label}</button></div>; }
function SimpleSelect({ value, onChange, options, ariaLabel }: { value: string; onChange: (value: string) => void; options: [string, string][]; ariaLabel: string }) { return <SelectMenu value={value} onValueChange={onChange} aria-label={ariaLabel} className={inputClass}>{options.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}</SelectMenu>; }
function InfoBar({ children }: { children: ReactNode }) { return <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Info className="size-4 shrink-0" />{children}</div>; }
function Badge({ className, children }: { className: string; children: ReactNode }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${className}`}>{children}</span>; }
function Notice({ children }: { children: ReactNode }) { return <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="size-4" />{children}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>{children}</label>; }
function FormCard({ title, children }: { title: string; children: ReactNode }) { return <section className={`${cardClass} p-5 lg:p-6`}><h2 className="mb-5 border-b border-stone-100 pb-4 text-base font-semibold text-stone-900">{title}</h2><div className="space-y-5">{children}</div></section>; }
function Choice({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) { return <button type="button" disabled={disabled} onClick={onClick} className={`h-10 rounded-lg border text-sm font-medium transition disabled:cursor-default ${active ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"} disabled:opacity-70`}>{children}</button>; }
function TextActions({ actions }: { actions: Array<[string, () => void]> }) { return <div className="flex items-center gap-2 whitespace-nowrap">{actions.map(([label, action], index) => <span key={label} className="flex items-center gap-2">{index > 0 && <span className="text-stone-300">|</span>}<button onClick={action} className="text-sm text-emerald-700 hover:text-emerald-900">{label}</button></span>)}</div>; }
function MenuButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button onClick={onClick} className="block w-full rounded-md px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50">{children}</button>; }
