# Yoga Admin Demo — data consistency fix (2026-11-17)

Local export fix only. Figma Make project untouched.

## Root causes verified

1. **Card status drift** — `Member.monthlyStatus` was a fixed seed string. 用户卡包 used date-based `cardStatus()` (`expireAt < today`), so 林晓 could show 有效 in 会员 while 已过期 in 用户卡包. 苏晴/李然/冯露 kept 即将到期 after calendar expiry.
2. **Dashboard 今日课程** — used `sessions.slice(0, 3)` instead of filtering `session.date === today`, and booked counts came from sparse reservations (e.g. 1/20) while 排课 used `session.booked` (18/20).
3. **UTC date shift** — `data.ts` seeded with `Date#toISOString().slice(0, 10)`, which moves the calendar day back between 00:00–08:00 in Asia/Kuala_Lumpur (UTC+8).
4. **Orders / Reconciliation** — separate fake catalog (王玲/赵一, PKG-2601…) and May/June 2026 stamps, disconnected from store members/packages (PKG-000x).

## Changes

- Added `src/app/lib/dates.ts` — local calendar helpers (no `toISOString` for day keys).
- Added `src/app/lib/cardStatus.ts` — shared `computeMonthlyStatus`, `computePackCardStatus`, `isMonthlyBookable` (expiry day inclusive).
- Added `src/app/lib/demoCommerce.ts` — demo orders/recon built from shared `members` + `packageProducts`, relative recent dates; monthly revenue chart sums 已支付 `actualAmount` only (empty months = 0, no filler).
- `data.ts` — local `addDaysFromToday`; member expiries as relative offsets; `monthlyStatus` derived at seed time; package product records unchanged.
- `store.tsx` — `canBook` uses `isMonthlyBookable`; purchase/extend refresh derived status.
- `Members.tsx` / `Packages.tsx` / `Dashboard.tsx` — display and filters use derived status; dashboard filters today’s sessions, uses `session.booked`, empty state, relative revenue.
- `Orders.tsx` / `Reconciliation.tsx` — seed from shared demo commerce; offline order picker uses store members/packages.
- Tests: `src/app/lib/__tests__/{dates,cardStatus,demoCommerce}.test.ts` (vitest).

## Out of scope (unchanged)

Dead buttons, style redesign, `/analytics` removal, packages mockup layout polish, Radix migrations.

## Limitations

- 本月消课金额 has no attendance-amount source in demo data; dashboard shows ¥0 rather than inventing a figure. 本月营收 matches current-month paid demo orders.
