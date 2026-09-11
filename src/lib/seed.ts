import type { Product, ShopState, Staff, Supplier } from "./types";

const p = (
  name: string,
  category: string,
  sku: string,
  cost: number,
  price: number,
  stock: number,
  minStock: number,
  unit: string,
): Product => ({
  id: sku.toLowerCase(),
  name,
  category,
  sku,
  barcode: "60" + Math.abs(hash(sku)).toString().padStart(11, "0").slice(0, 11),
  cost,
  price,
  stock,
  minStock,
  unit,
});

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export const SEED_PRODUCTS: Product[] = [
  p("Chibbo Potato Crisps 50g", "Chips & Crisps", "SNK-001", 1200, 2000, 48, 12, "Pack"),
  p("Simba Nyama Chips", "Chips & Crisps", "SNK-002", 1500, 2500, 30, 10, "Pack"),
  p("Plantain Crisps Kabalagala", "Chips & Crisps", "SNK-003", 900, 1500, 8, 10, "Pack"),
  p("Britania Marie Biscuits", "Biscuits", "BIS-001", 1000, 1500, 60, 15, "Pack"),
  p("Nice Coconut Biscuits", "Biscuits", "BIS-002", 800, 1200, 25, 10, "Pack"),
  p("Digestive Wheat Biscuits", "Biscuits", "BIS-003", 4500, 6500, 12, 6, "Box"),
  p("Cadbury Dairy Milk 40g", "Chocolates", "CHO-001", 3500, 5000, 20, 8, "Piece"),
  p("Snickers Bar", "Chocolates", "CHO-002", 3000, 4500, 0, 6, "Piece"),
  p("Coca Cola 500ml", "Beverages", "BEV-001", 1300, 2000, 72, 24, "Bottle"),
  p("Novida Pineapple 300ml", "Beverages", "BEV-002", 1200, 1800, 40, 12, "Bottle"),
  p("Rwenzori Water 1L", "Beverages", "BEV-003", 1000, 1500, 36, 12, "Bottle"),
  p("Redbull Energy", "Beverages", "BEV-004", 5000, 7000, 9, 6, "Can"),
  p("Roasted G-Nuts", "Nuts & Seeds", "NUT-001", 6000, 9000, 14, 5, "KG"),
  p("Cashew Nuts Salted 100g", "Nuts & Seeds", "NUT-002", 4000, 6000, 7, 8, "Pack"),
  p("Simsim Snap Bar", "Nuts & Seeds", "NUT-003", 500, 1000, 80, 20, "Piece"),
  p("Mandazi", "Pastries", "PAS-001", 300, 500, 40, 20, "Piece"),
  p("Meat Samosa", "Pastries", "PAS-002", 700, 1000, 25, 15, "Piece"),
  p("Queen Cakes", "Pastries", "PAS-003", 400, 700, 5, 15, "Piece"),
  p("Goody Goody Toffees", "Sweets", "SWT-001", 100, 200, 200, 50, "Piece"),
  p("Lollipop Assorted", "Sweets", "SWT-002", 200, 400, 120, 40, "Piece"),
  p("Chewing Gum Big G", "Sweets", "SWT-003", 2000, 3000, 18, 6, "Bundle"),
];

export const SEED_STAFF: Staff[] = [
  { id: "s1", name: "Alvin Sam", role: "Admin", pin: "1111", username: "alvin", password: "timesam", color: "var(--brand)" },
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "sup1",
    name: "Kikuubo Wholesalers",
    contact: "Mr. Ssekandi",
    phone: "0772 456 123",
    email: "sales@kikuubo.ug",
    address: "Kikuubo Lane, Kampala",
  },
  {
    id: "sup2",
    name: "Britania Distributors",
    contact: "Ms. Nabirye",
    phone: "0701 998 220",
    email: "orders@britania.ug",
    address: "Industrial Area, Kampala",
  },
  {
    id: "sup3",
    name: "Century Bottling Co.",
    contact: "Mr. Mugisha",
    phone: "0755 300 771",
    email: "depot@century.ug",
    address: "Namanve, Mukono",
  },
];

export function seedState(): ShopState {
  return {
    products: SEED_PRODUCTS,
    sales: [],
    expenses: [],
    suppliers: SEED_SUPPLIERS,
    deliveries: [],
    adjustments: [],
    staff: SEED_STAFF,
    activeStaffId: "s1",
    taxRate: 0,
  };
}
