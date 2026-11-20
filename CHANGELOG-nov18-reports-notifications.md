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
- 订单管理: the table no longer uses fixed column widths that added up to 1140px. Columns size to their content and share the spare width, so all eight columns, including 创建时间, fit without scrolling from about 1200px wide. Narrower windows still scroll sideways with 操作 pinned. Long package names are cut off with an ellipsis at 200px and show in full on hover.

## Phones and tablets

Checked every page at 360, 390, 768, 1024 and 1280px in WebKit. No page scrolls sideways; wide tables scroll inside their own panel.

- **Navigation:** below 1024px the sidebar is a drawer, opened from the ☰ button in the top bar. It closes on the backdrop, the ✕ button, Escape, or picking a page.
- **Top bar:** shorter on phones, with less padding and the subtitle hidden.
  - The search becomes an icon that opens a full-width search field.
  - The notifications panel spans the screen.
  - The page action button (排课 / 新建课程 / 新增教练) shows only its + icon.
- **Page padding:** tighter on phones, `p-4 sm:p-6 lg:p-8`.
- **Stat cards:** 2 × 2 on phones (3 across on 套餐管理), with smaller icons so the labels no longer wrap one character per line. Pages: 概览, 订单, 对账, 会员, 预约管理, 教练, 审计日志.
- **Two-column sections stack below 1280px:** 概览 charts and lists, 审计日志 stats and distribution, 数据报表 cards. The 数据报表 grids no longer push the page wider than the screen.
- **Lists:**
  - 课程 cards show 1 / 2 / 3 per row.
  - 概览's 今日课程 rows put the fill bar on its own line on phones.
  - 通知公告, 审计日志 and 设置 › 高级配置 tables now scroll sideways like 订单 and 对账, instead of squeezing their columns. 操作 stays pinned on the right where it was.
- **排课:**
  - The toolbar wraps and the export button becomes an icon.
  - The day view is still the default.
  - The week view scrolls sideways on narrow screens with the time column and day header pinned, and opens scrolled to today.
- **设置:** the section list becomes a horizontal tab strip, and forms and the photo wall use fewer columns.
- **管理员资料:** the header stacks, and the name no longer runs into the banner.
- **Forms:** the notice form's date fields go to two columns on phones.
- **Date range picker:** presets sit in one scrollable row on phones, and the popup scrolls instead of running off the bottom of the screen.
- **套餐 editor:** the save bar spans the full width when the sidebar is hidden (it was offset by the sidebar's width).
- **会员 filters:** wrap 2 × 2 between 768 and 1279px. They overflowed the card at 1024px.

Fixed along the way:

- The 排课 drawer's 对用户可见 switch knob sat outside the switch in Safari.
- 设置 edit/delete and photo buttons only appeared on hover, so touch screens could not reach them. They are now always shown on touch screens.
- 概览's two 查看全部 links did nothing. They now open 排课 and 会员.
- 管理员资料's 最近登录 list showed April dates. It is now relative to today.

## Login and logout

- **管理员登录 page (`#/login`):** username or email plus password, with these extras:
  - Show/hide password.
  - A Caps Lock warning.
  - “7 天内自动登录”.
  - A 忘记密码 note.
  - A 登录中… loading state.
  - The demo account (admin / demo1234), with a 填入账号 button.

  On desktop a brand panel sits on the left; on phones the page is a single column, and the fields use 16px text so iOS doesn't zoom in on focus.
- **Sign-in required:** every app page now requires sign-in. A signed-out visit to a link such as `#/orders` goes to the login page and returns to that page after signing in.
- **Signing out:** use the new icon beside the profile at the bottom of the sidebar, or 管理员资料 › 退出登录 (that button did nothing before). Both ask for confirmation, then open a 你已安全退出 page (`#/logout`) showing when the session started and how long it lasted, with a 重新登录 button. Opening `#/logout` directly also signs out.
- **How the demo sign-in works:** it is checked in the browser only (`lib/auth.ts`, tested in `lib/__tests__/auth.test.ts`). The session is kept in sessionStorage, or in localStorage for 7 days with 自动登录. If storage is blocked, it is kept in memory for the tab.
- **Demo data survives sign-out:** the data now lives above the router, so edits made in the demo are kept when you sign out and back in within the same tab.
- **管理员资料 › 最近登录:** the first row is now the current session's real sign-in time.

## Dropdowns

- Every single-choice dropdown now opens an in-app list (`SelectMenu`) instead of the operating system's menu: white panel, rounded corners, the current choice tinted green with a check, and a hover highlight. Long lists scroll inside a 320px panel.
- The closed control keeps the width of its longest option, as before. Required pickers in forms (学员, 课程, 教练) show a grey placeholder until something is chosen.
- Escape closes only the open list, not the dialog or drawer around it. Keyboard use (arrows, Enter, type-to-jump) works as with a native select.

## Time picker

- 排课's 开始时间 and 结束时间 open an in-app picker (`TimeField`) instead of Safari's bare time box: hour and minute columns (5-minute steps) with the current time centred and highlighted green. Arrow keys move through each column.
- The end-time picker greys out times that aren't after the start, and offers 45 / 60 / 75 / 90 分钟 shortcuts counted from the start.
- Changing the start time moves the end time with it, so the class keeps its length. The length shows under the fields (课程时长 1 小时 15 分钟).

## Timetable image

- 排课 → 导出课程表 now makes a picture of the week shown instead of a CSV. It opens a preview, and 下载图片 saves `课程表-<from>-<to>.png` (2960 px wide, sharp enough to print or post). On a phone you can also long-press the preview to save it.
- The image has one column per day (周一–周日) and one card per class: time, course, coach · room, 团课/私教 · level, and seats taken (已约 18/20, or 已满). Each course keeps the same colour as in the week view. Days with no classes say 暂无课程.
- Classes hidden from members (对用户可见 off) are left out, so the picture matches what members see. The preview says how many were left out.
- Drawn directly on a canvas (`lib/renderScheduleImage.ts`), so no new dependency and no screenshot of the page. If the Noto Sans SC web font can't load, the system Chinese font is used after at most about a second.

## Difficulty

- Courses and scheduled classes now share one difficulty scale: 1–5 stars, named 入门 / 初级 / 中级 / 进阶 / 高级. Before, a course was 初级/中级/高级 while the 排课 drawer showed stars labelled 非常简单 … 非常困难, so the two pages could disagree.
- This follows the API: a course has a default difficulty (`courses.difficulty`) and each class has its own (`course_sessions.difficulty`). A new class starts at its course's default, and choosing another course in the 排课 drawer brings that course's difficulty with it. If a class is set differently, the drawer says so and offers 恢复默认.
- The course list, the 排课 list, the dashboard, search results and the exported timetable image all use the same stars or words.

## Coaches

- Removed coach ratings for now: the 评分 figure on each coach card and the 平均评分 box at the top of the page.
- The coach numbers are now worked out from the schedule instead of being made up:
  - 累计学员人次 on each card (was 累计学员, a fixed placeholder) adds up the bookings across all of the coach's classes, the way the real coach report counts 学员数. A member who comes three times counts three times.
  - 本周课程 and 本周授课节数 count only this week's classes (Monday to Sunday). Before, they counted every class on the schedule, including next week's.
  - 本月授课学员人次 adds up this month's bookings (was a fixed 486 with a made-up "较上月 +8.2%").
