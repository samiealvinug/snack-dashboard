export type Category =
  | "Chips & Crisps"
  | "Biscuits"
  | "Chocolates"
  | "Beverages"
  | "Nuts & Seeds"
  | "Pastries"
  | "Sweets";

export const CATEGORIES: Category[] = [
  "Chips & Crisps",
  "Biscuits",
  "Chocolates",
  "Beverages",
  "Nuts & Seeds",
  "Pastries",
  "Sweets",
];

export const UNITS = [
  "Pack",
  "Piece",
  "Slices",
  "KG",
  "Grams",
  "Litre",
  "Bottle",
  "Can",
  "Box",
  "Bundle",
  "Carton",
];

export type Product = {
  id: string;
  name: string;
  category: Category | string;
  sku: string;
  barcode: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string | undefined;
};

export type PaymentMethod = "Cash" | "MTN Mobile Money" | "Airtel Money" | "Bank Card";

export type SaleItem = {
  productId: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  cost: number;
};

export type Sale = {
  id: string;
  receiptNo: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  cogs: number;
  payment: PaymentMethod;
  cashGiven?: number | undefined;
  change?: number | undefined;
  staffId: string;
  staffName: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
  payment: PaymentMethod;
};

export const EXPENSE_CATEGORIES = [
  "Electricity",
  "Rent",
  "Transport/Delivery",
  "Packaging",
  "Staff Wages",
  "Waste",
  "Other",
];

export type Supplier = {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
};

export type DeliveryItem = {
  productId: string;
  name: string;
  qty: number;
  cost: number;
};

export type Delivery = {
  id: string;
  supplier: string;
  reference: string;
  date: string;
  notes: string;
  items: DeliveryItem[];
  total: number;
  staffName: string;
};

export type Adjustment = {
  id: string;
  date: string;
  productId: string;
  productName: string;
  before: number;
  after: number;
  reason: string;
  staffName: string;
};

export type Role = "Admin" | "Cashier";

export type Staff = {
  id: string;
  name: string;
  role: Role;
  pin: string;
  username?: string;
  password?: string;
  color: string;
};

/** Username used to log in — falls back to the first name in lowercase. */
export function staffUsername(s: Staff) {
  return (s.username ?? s.name.split(" ").pop() ?? s.name).toLowerCase().replace(/\s+/g, "");
}

/** Password used to log in — falls back to the staff PIN. */
export function staffPassword(s: Staff) {
  return s.password ?? s.pin;
}

export type ShopState = {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  suppliers: Supplier[];
  deliveries: Delivery[];
  adjustments: Adjustment[];
  staff: Staff[];
  activeStaffId: string;
  taxRate: number;
};
