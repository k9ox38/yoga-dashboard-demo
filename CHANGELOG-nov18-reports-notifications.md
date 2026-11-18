# Yoga Admin Demo — Reports & Notifications fixes (2026-11-18)

## Reports (数据报表)

- **Ties to demo data.** The 流失风险 list, its filter counts, the member KPIs, 预收余额 and the 需要关注 alerts are now computed from the shared store (members, cards, schedule, reconciliation). Before, they were hard-coded and contradicted the 会员 page (e.g. 苏晴 shown as 已过期 / last visit 09-11 while her card was 即将到期).
- **Catalog names.** The course table, heatmap and revenue mix use the real class templates, coaches and package names.
- **Dates.** The period label, date range, chart months, week labels and "数据更新于" stamp are computed from today and the selected period. The non-functional 自定义 preset was removed.
- **Sample data, clearly labelled.** The demo has no attendance or finance history, so the revenue, attendance, fill, cohort, funnel and renewal trends stay as sample series. They are marked 示例, use catalog names, and are internally consistent (KPIs are computed from the same series the charts show). They are not reconciled with the Orders page.
- **Fixes:**
  - Revenue tooltip now shows series names.
  - 出勤率 / 取消率 moved into the card header (no more negative-margin overlap).
  - Alert titles wrap instead of truncating.
  - Trend chips separate direction from good/bad.
  - Tabs have ARIA roles.
  - Heatmap fits without horizontal scroll at 1440px.
- **Buttons wired:**
  - 订阅月报 toggles on and off.
  - 导出报表 downloads a CSV.
  - 提醒 logs an activity on the member.
  - Alert actions and 查看全部课程 / 在会员页查看全部 navigate to 排课, 会员, 课程 and 对账.

## Notifications (通知公告)

- Seed notices are dated relative to today, so published ones are inside their display window, drafts are upcoming, and archived ones have ended.
- Published rows show a 展示中 / 未开始 / 已结束 chip.
- The 苏菲娅 notice was replaced: she is 禁用 and her class is hidden.
- Publish, archive and save use local time (`localDateTime`) instead of `toISOString()`, which was 8 hours behind.
- `setInterval` state was renamed to `bannerInterval`.

## Elsewhere

- `data.ts`: member `lastClass` uses relative `lastClassDays`, like `expiryDays`, so the at-risk list doesn't grow as the calendar moves.
- `Settings.tsx` and `Reconciliation.tsx`: removed the remaining `toISOString()` date stamps.
- Tests: `src/app/lib/__tests__/reportMetrics.test.ts` covers period ranges, risk-list agreement with the member seed, and notice windows/timestamps.
- `theme.css`: native `<select>`s get `appearance: none` and a flat chevron. Safari was painting its grey bevelled control inside the bordered box (Packages, Members, Reservations, the card drawer, the modals, Settings and Profile). Selects that already use `appearance-none` with their own chevron icon (Orders, Notifications, Audit Log, Reconciliation) are excluded. Selects also no longer inherit the bold weight of their surrounding `<label>`.
- Date pickers: every `<input type="date">` is replaced by an in-app calendar (`components/DatePicker.tsx`, built on `react-day-picker`, which was already a dependency). Safari's native popup was dark, in English and showed dd/mm/yyyy.
  - `DateRangePicker` is used by the filters on Orders, Reconciliation, Audit Log, Reservations and the instructor's 近期排课 tab. It has quick presets (今天 / 近 7 天 / 本月 …), shows two months on desktop and one on phones, and previews the range on hover. Changes apply on 确定.
  - `DateField` is used by the 排课 date and the notice 发布 / 展示 dates. Picking a day applies it.
  - Range logic lives in `lib/dateRange.ts`, covered by `lib/__tests__/dateRange.test.ts`. Time fields (`type="time"`) are unchanged; Safari shows them as plain segmented fields with no popup.

## Still sample / not wired

- The 课程与排课, 营收与财务 and 教练绩效 tabs are placeholders.
- The 对比 / 课程类型 / 教练 filter chips are display-only.

## Review pass: polish and consistency

- 排课: 导出课程表 was wired to the create handler, so it opened the new-session form. It now downloads the week as CSV, which also removes the long-standing `Schedule.tsx:397` type error. The page opens on today instead of Monday. The week view starts at 06:00, because the 06:30 进阶强化 class was being drawn at 07:00. The export and view toggle buttons are restyled to match the rest of the app.
- Global fields:
  - Text in multi-line text boxes is no longer bold.
  - Safari's number-field stepper glyph is hidden.
  - The shared `Input` gets a visible border; the new-member and edit-member drawers and the card drawer 备注 had borderless white fields.
  - `index.html` declares `color-scheme: light`, since the app has no dark theme; Safari was drawing dark native popups and menus.
- 数据报表: KPI rows of six lay out 3 × 2 or 6 × 1 instead of 5 + 1. Chart legends use ink-coloured labels.
- `/analytics`: an unlinked placeholder page with an "占位" chart. It now redirects to 数据报表 and the old files are removed.
- 对账管理: the table is regridded. Amount and currency no longer run together, the time no longer touches the status, the 详情 / 匹配 buttons no longer wrap, and the header is light like Orders.
- 审计日志:
  - The log entries are relative to today and refer to real demo members, orders, notices and sessions; they were from June and named people and notices that no longer exist.
  - The stat cards fill a 2 × 2 grid and the table header is light.
- 概览: the hard-coded "+12.4%" and the ¥0 "暂无消课金额数据" card are replaced with live numbers (今日课节数, 近 30 天到访会员). 本月营收 no longer shows a red down-arrow next to "—".
- Smaller fixes:
  - Duplicate 创建课程 and 新增套餐 buttons are removed.
  - 查看套餐 fields look read-only, and the "修改仅影响后续购卡" note only shows when editing.
  - The notice modal shows 最近更新 instead of the raw id `n1`.
  - Reservation 预约时间 values are relative instead of April.
- One primary green: the dark teal `booking-primary` on 会员, 预约管理 and the card drawer, the darker green on 套餐 and 数据报表, and the black buttons on 对账, 设置 and the notice archive confirm all use `emerald-600` (hover `emerald-700`), like the sidebar. The `--booking-primary` token is set to the same green. Irreversible money and close actions (确认退款, 发起退款, 关闭订单) are rose instead of blue or black. The audit detail modal uses a light header and light before/after panels.
- 苏菲娅 is disabled, so her upcoming 空中吊绳 class (s5) and its booking were removed from the seed. The audit log records the cancellation right after the coach was disabled.
