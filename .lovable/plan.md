Add a stat cards row back to `src/pages/Bank.tsx`, placed above the "My Cards" section inside the main content area.

Cards to display (using existing `StatCard` component and totals already computed on line 234):

1. **Total Balance** — `balance` from `useBank`, icon `Wallet`, variant `default`
2. **Total Deposits** — `totals.deposits`, icon `ArrowUpCircle`, variant `success`
3. **Total Withdrawals** — `totals.withdrawals`, icon `ArrowDownCircle`, variant `warning`
4. **Sale Profits** — `totals.profits`, icon `TrendingUp`, variant `success`

Layout: `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` matching the dashboard pattern. Format currency via `formatCurrency`.

No schema or hook changes — data is already computed.