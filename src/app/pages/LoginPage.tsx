import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AlertCircle, CalendarCheck, Eye, EyeOff, Loader2, Lock, ReceiptText, User, Users } from "lucide-react";
import { BrandMark } from "../components/BrandMark";
import { DEMO_ACCOUNT, REMEMBER_DAYS, readSession, signIn } from "../lib/auth";

const FEATURES = [
  { icon: CalendarCheck, title: "排课与预约", text: "按周排课、代学员预约，到课与取消一目了然。" },
  { icon: Users, title: "会员与卡包", text: "月卡、课时包与私教次数集中管理，到期前提醒。" },
  { icon: ReceiptText, title: "订单与对账", text: "线上线下订单统一记录，渠道流水逐笔核对。" },
];

type FieldError = { field: "username" | "password" | "both"; message: string };

const inputBase =
  "h-11 w-full rounded-lg border bg-white pl-10 text-base text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:ring-2 sm:text-sm";
const inputOk = "border-stone-200 focus:border-emerald-500 focus:ring-emerald-500/25";
const inputBad = "border-rose-300 focus:border-rose-400 focus:ring-rose-500/20";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const target = from && !["/", "/login", "/logout"].includes(from) ? from : "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (readSession()) return <Navigate to={target} replace />;

  const fail = (next: FieldError) => {
    setError(next);
    setSubmitting(false);
    (next.field === "username" ? usernameRef : passwordRef).current?.focus();
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    if (!username.trim()) return fail({ field: "username", message: "请输入用户名" });
    if (!password) return fail({ field: "password", message: "请输入密码" });
    setError(null);
    setSubmitting(true);
    // A short pause so the button's loading state reads like a real request.
    timer.current = window.setTimeout(() => {
      const result = signIn(username, password, remember);
      if (result.ok) {
        navigate(target, { replace: true });
        return;
      }
      setPassword("");
      fail({ field: result.field, message: result.error === "用户名或密码错误" ? "用户名或密码错误，请重新输入" : result.error });
    }, 600);
  };

  const fillDemo = () => {
    setUsername(DEMO_ACCOUNT.username);
    setPassword(DEMO_ACCOUNT.password);
    setError(null);
  };

  const userInvalid = error?.field === "username" || error?.field === "both";
  const passInvalid = error?.field === "password" || error?.field === "both";

  return (
    <div className="flex min-h-dvh bg-stone-50 text-stone-800">
      {/* Brand panel, desktop only */}
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-10 text-white lg:flex xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-60 rounded-full bg-white/[0.06]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-emerald-300/15 blur-3xl" />

        <BrandMark tone="light" className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-[32px] font-semibold leading-snug tracking-tight">让每一节课<br />都被妥善安排</h2>
          <p className="mt-4 text-sm leading-7 text-emerald-50/85">排课、预约、会员卡包与订单对账，在同一个后台完成。</p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15"><Icon className="size-[18px]" /></span>
                <span><span className="block text-sm font-medium">{title}</span><span className="mt-0.5 block text-sm text-emerald-50/75">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-50/65">演示环境 · 页面中的会员、订单与金额均为虚构数据</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-[380px]">
            <BrandMark className="mb-10 lg:hidden" />
            <h1 className="text-2xl font-semibold text-stone-900">管理员登录</h1>
            <p className="mt-2 text-sm text-stone-500">欢迎回来，请输入账号信息进入管理后台。</p>

            {error && (
              <div id="login-error" role="alert" className="mt-6 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />{error.message}
              </div>
            )}

            <form noValidate onSubmit={submit} className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">用户名</span>
                <span className="relative mt-1.5 block">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <input
                    ref={usernameRef}
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    value={username}
                    onChange={(event) => { setUsername(event.target.value); if (error) setError(null); }}
                    placeholder="用户名或邮箱"
                    aria-invalid={userInvalid || undefined}
                    aria-describedby={userInvalid ? "login-error" : undefined}
                    className={`${inputBase} pr-3 ${userInvalid ? inputBad : inputOk}`}
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">密码</span>
                <span className="relative mt-1.5 block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <input
                    ref={passwordRef}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); if (error) setError(null); }}
                    onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                    onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLock(false)}
                    placeholder="请输入密码"
                    aria-invalid={passInvalid || undefined}
                    aria-describedby={passInvalid ? "login-error" : undefined}
                    className={`${inputBase} pr-11 ${passInvalid ? inputBad : inputOk}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </span>
                {capsLock && <span className="mt-1.5 block text-xs text-amber-700">大写锁定已开启</span>}
              </label>

              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-stone-600">
                  <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 rounded accent-emerald-600" />
                  {REMEMBER_DAYS} 天内自动登录
                </label>
                <button type="button" onClick={() => setForgotOpen((open) => !open)} aria-expanded={forgotOpen} className="text-sm font-normal text-emerald-700 hover:underline">忘记密码？</button>
              </div>
              {forgotOpen && (
                <p className="rounded-lg bg-stone-100 px-3 py-2.5 text-xs leading-5 text-stone-600">
                  演示环境不支持找回密码。正式系统中，请联系馆长或超级管理员为你重置密码。
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:bg-emerald-600/80"
              >
                {submitting ? <><Loader2 className="size-4 animate-spin" />登录中…</> : "登录"}
              </button>
            </form>

            <section aria-label="演示账号" className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-800">演示账号</span>
                <button type="button" onClick={fillDemo} className="rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">填入账号</button>
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-stone-500">用户名</dt><dd className="font-mono text-stone-800">{DEMO_ACCOUNT.username}</dd>
                <dt className="text-stone-500">密码</dt><dd className="font-mono text-stone-800">{DEMO_ACCOUNT.password}</dd>
              </dl>
              <p className="mt-2 text-xs text-stone-400">只在本浏览器中校验，不连接任何真实系统。</p>
            </section>
          </div>
        </div>
        <footer className="px-6 pb-6 text-center text-xs text-stone-400">瑜伽管理演示 · 仅用于界面演示</footer>
      </main>
    </div>
  );
}
