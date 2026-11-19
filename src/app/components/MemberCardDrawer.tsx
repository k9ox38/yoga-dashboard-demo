import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useStore } from "../store-context";
import type { Member } from "./data";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SelectMenu } from "./SelectMenu";

export type MemberPackagePreset = "pass" | "private";
const selectClass = "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15";

export function MemberCardDrawer({ member, preset, onClose, onSuccess }: {
  member: Member;
  preset?: MemberPackagePreset;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const { packages, purchasePackage } = useStore();
  const availablePackages = useMemo(() => packages.filter((item) => item.status === "上架中"), [packages]);
  const initialPackage = availablePackages.find((item) => preset === "pass" ? item.type === "pass" : preset === "private" ? item.scope === "private" : false) ?? availablePackages[0];
  const [packageId, setPackageId] = useState(initialPackage?.id ?? "");
  const [payment, setPayment] = useState("微信");
  const selectedPackage = availablePackages.find((item) => item.id === packageId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPackage) return;
    purchasePackage(member.id, selectedPackage.id, payment);
    onSuccess(`${selectedPackage.name} 办理成功，会员权益已更新。`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/50" role="presentation" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="办理购卡" className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div><div className="font-semibold text-slate-950">办理购卡</div><div className="mt-1 text-sm text-slate-500">为 {member.name} 选择套餐并登记支付信息。</div></div>
          <Button type="button" variant="ghost" size="icon" aria-label="关闭" onClick={onClose}><X /></Button>
        </div>
        <form className="space-y-5 p-6" onSubmit={submit}>
          <div className="space-y-2"><div className="text-sm font-medium">选择套餐</div><SelectMenu aria-label="选择套餐" value={packageId} onValueChange={setPackageId} className={selectClass}>{availablePackages.map((item) => <option key={item.id} value={item.id}>{item.name} · ¥{item.price.toLocaleString()}</option>)}</SelectMenu>{!availablePackages.length && <div className="text-sm text-amber-700">暂无上架中的套餐，请先在套餐管理中上架产品。</div>}</div>
          <div className="space-y-2"><div className="text-sm font-medium">支付方式</div><SelectMenu aria-label="支付方式" value={payment} onValueChange={setPayment} className={selectClass}>{["微信", "支付宝", "线下现金"].map((item) => <option key={item}>{item}</option>)}</SelectMenu></div>
          <div className="space-y-2"><div className="text-sm font-medium">备注</div><Textarea placeholder="选填，记录收款或卡项说明" className="min-h-24 bg-white" /></div>
          <Button type="submit" disabled={!selectedPackage} className="h-11 w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">确认办理</Button>
        </form>
      </div>
    </div>
  );
}
