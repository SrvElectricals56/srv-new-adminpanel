# SRV Electricals — Admin Panel

## Tech Stack
- **Next.js 16** with TypeScript
- **React 19**
- Inline CSS-in-JS (no extra dependencies needed beyond listed)

## How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
http://localhost:3000
```

## Admin Panel Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | KPIs, scan chart, tier distribution, pending items |
| Electricians | `/` → sidebar | Full CRUD with 8 sub-categories, view/edit/add/delete |
| Dealers | `/` → sidebar | Full CRUD, grid + table view, linked electricians |
| Products | `/` → sidebar | Full product catalog with stock, points, images |
| Points Config | `/` → sidebar | Configure base + bonus points per product |
| Scan History | `/` → sidebar | All scan events, filter by role |
| Redemptions | `/` → sidebar | Approve/reject redemption requests |
| Offers & Promos | `/` → sidebar | Create/edit promotional offers |
| Notifications | `/` → sidebar | Send push notifications to users |
| App Banners | `/` → sidebar | Manage in-app promotional banners |
| Reports | `/` → sidebar | Analytics, top products, state breakdown |
| Settings | `/` → sidebar | App config, support contacts, admin accounts |


