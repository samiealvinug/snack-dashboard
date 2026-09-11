# SnackPoint POS

Build a comprehensive, full-stack Retail Snack Shop & Confectionery Management System (POS, Inventory, Stock Receiving, Expense Tracker, Profit/Loss Reports, and Multi-Staff Portal). The application must default to Uganda Shillings (UGX) currency formatting.

### 🎯 Target Audience & Usability Archetype:

Designed for non-tech-savvy shop owners and retail cashiers. Use a clean, high-contrast UI with large touch targets, bold readable numbers, clear status badges (In Stock / Running Low / Finished), audio cash register chimes, and instant 1-click staff switching.

---

### 🛠️ Core Modules & Capabilities:

#### 1. Live Sales Register & Point of Sale (POS)

- **Product Catalog Grid & Search**: Fast search by snack name, SKU, or barcode with category chips (Chips & Crisps, Biscuits, Chocolates, Beverages, Nuts & Seeds, Pastries, Sweets).

- **Interactive Cart & Bottom Sheet Drawer**: Quantity steppers (+/-), unit price, wholesale cost tracking, discount input, and tax calculations.

- **Payment Processing**: Support for Cash (with quick change calculator: e.g. Customer pays 10,000 UGX on a 6,500 UGX bill -> Change: 3,500 UGX), MTN Mobile Money, Airtel Money, and Bank Card.

- **Real-Time Sale Alerts & Sound Engine**: Synthesize an audio cash register chime upon checkout and broadcast an instant sale popup notification with full receipt details.

- **Receipt Modal & Thermal Print**: Render printable/downloadable itemized receipts with store logo, tax breakdown, cashier name, and barcode.

#### 2. Snack Catalog & Product Manager

- **Product Details**: Snack Name, Category, SKU, Barcode, Buying Price (Cost), Selling Price, Initial Stock, Minimum Alert Threshold, and Image URL.

- **Flexible Unit Selection**: Preset dropdown for standard retail units (Pack, Piece, Slices, KG, Grams, Litre, Bottle, Can, Box, Bundle, Carton) plus an instant **"+ Enter Custom Unit"** text input.

- **Dual View Modes**: Switch seamlessly between visual Product Cards and an audit Table View with stock badges.

#### 3. Stock Receiving & Restocking Hub

- **Delivery Batch Registration**: Record incoming supplier shipments with Supplier Name (autocomplete), Invoice/Reference #, Date Received, and Delivery Notes.

- **Interactive "+ Add Item via Form" Modal**: A popup form allowing attendants to search the catalog, adjust received quantity using +/- steppers or quick preset chips (+10, +20, +50, +100), update buying cost per unit, and preview the live stock increase (Current Stock -> New Stock) before saving.

- **Physical Count Audit & Adjustment**: Allows the manager to recount physical shelf stock, log adjustments (e.g. "Routine audit", "Damaged / Expired stock write-off"), and track discrepancies.

#### 4. Financials, Profit & Loss, & Daily Reports

- **Real-Time Dashboard**: Summary metric cards for Today's Sales, Weekly Sales, Monthly Sales, Low Stock Alerts, Total Stock on Shelf, and Gross Profit Margin.

- **Interactive Analytics Charts**: 7-Day sales trend area chart and Top Selling Snacks leaderboard by volume and revenue.

- **Expense Tracker**: Log operational shop expenses (Electricity, Rent, Transport/Delivery, Packaging, Staff Wages, Waste) with date and payment method.

- **Profit & Loss Statement**: Automatically compute Net Profit = Total Sales Revenue - Cost of Goods Sold (COGS) - Total Operating Expenses.

#### 5. Suppliers & Purchase History

- Supplier directory with contact person, phone number, email, address, and delivery logs.

#### 6. Multi-User Staff Portal & Security

- Role-based permissions: **Admin / Manager** (Full control, reports, price changes, deletions) and **Cashier / Salesperson** (POS register, viewing catalog, receiving stock deliveries).

- **1-Click Quick Staff Switcher**: Accessible profiles on login for quick counter handover without cumbersome re-typing.

---

### 🎨 Architecture & Technical Stack:

- **Framework**: React 18+ with TypeScript, Vite, and Tailwind CSS.

- **Icons & Visuals**: `lucide-react` icons.

- **Charts**: `recharts` for sales trend visualizers.

- **Backend & Persistence**: Full-stack Express server (`/api/*`) with dual-layer offline-first persistence (`localStorage` fallback caching and background sync) so the app functions smoothly even if network/server is starting up.

- **Sound Utility**: Web Audio API sine-wave synthesizer for sale chimes (no external audio files required).

- **Currency Helper**: Format all prices cleanly as `UGX 15,000` (no floating cents or decimals unless specified).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://snack-shack-boss.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db32cf55-e24f-4bca-8cba-3bdf4ec07c81).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel. Keep the project root at the repository root.
2. Use `npm run build` as the build command. The Vercel Nitro preset is already configured in `vite.config.ts`; no output directory override is needed.
3. Add these environment variables in Vercel for Development, Preview, and Production:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`SUPABASE_SERVICE_ROLE_KEY` is only needed if server-side admin operations are added later. Never expose it with a `VITE_` prefix.

4. In Supabase Dashboard > Authentication > URL Configuration, set the Vercel deployment URL as the Site URL and add the production and preview URLs to the redirect allow list.
5. Deploy, then verify `/`, `/auth`, a sign-in, and one cloud-backed read/write flow. Keep the Supabase SQL migrations applied to the same project used by the environment variables.
