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

## Still sample / not wired

- The 课程与排课, 营收与财务 and 教练绩效 tabs are placeholders.
- The 对比 / 课程类型 / 教练 filter chips are display-only.
