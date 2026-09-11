import { Printer, X } from "lucide-react";
import { ugx } from "@/lib/currency";
import type { Sale } from "@/lib/types";

export function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4 print:static print:bg-transparent print:p-0">
      <div className="max-h-[90vh] w-full max-w-sm overflow-auto  bg-card p-1 shadow-lift print:max-h-none print:shadow-none">
        <div className="flex items-center justify-between px-4 pt-3 print:hidden">
          <span className="text-sm font-bold text-muted-foreground">Receipt</span>
          <button onClick={onClose} className=" p-1.5 hover:bg-accent" aria-label="Close receipt">
            <X className="size-5" />
          </button>
        </div>

        <div id="receipt-print" className="px-5 pb-4 pt-2 font-mono text-[13px] text-card-foreground">
          <div className="text-center">
            <p className="font-display text-xl font-extrabold tracking-tight">SWEET CORNER</p>
            <p className="text-xs text-muted-foreground">Snacks &amp; Confectionery</p>
            <p className="text-xs text-muted-foreground">Kampala, Uganda · 0772 000 000</p>
          </div>
          <Divider />
          <Row label="Receipt" value={sale.receiptNo} />
          <Row label="Date" value={new Date(sale.date).toLocaleString("en-UG")} />
          <Row label="Cashier" value={sale.staffName} />
          <Divider />
          {sale.items.map((i) => (
            <div key={i.productId} className="mb-1.5">
              <p className="font-bold">{i.name}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {i.qty} {i.unit} × {ugx(i.price)}
                </span>
                <span className="tabular text-card-foreground">{ugx(i.qty * i.price)}</span>
              </div>
            </div>
          ))}
          <Divider />
          <Row label="Subtotal" value={ugx(sale.subtotal)} />
          {sale.discount > 0 && <Row label="Discount" value={`- ${ugx(sale.discount)}`} />}
          {sale.tax > 0 && <Row label="Tax" value={ugx(sale.tax)} />}
          <div className="my-1.5 flex justify-between text-lg font-extrabold">
            <span>TOTAL</span>
            <span className="tabular">{ugx(sale.total)}</span>
          </div>
          <Row label="Paid via" value={sale.payment} />
          {sale.cashGiven != null && (
            <>
              <Row label="Cash given" value={ugx(sale.cashGiven)} />
              <Row label="Change" value={ugx(sale.change ?? 0)} />
            </>
          )}
          <Divider />
          <div className="flex h-12 items-end justify-center gap-[2px]" aria-hidden>
            {barcodeBars(sale.receiptNo).map((w, idx) => (
              <span key={idx} className="bg-foreground" style={{ width: w, height: "100%" }} />
            ))}
          </div>
          <p className="mt-1 text-center text-xs tracking-[0.3em]">{sale.receiptNo}</p>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Thank you! Come back soon 🍬
          </p>
        </div>

        <div className="flex gap-2 p-4 pt-0 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex flex-1 items-center justify-center gap-2  bg-primary py-3.5 font-bold text-primary-foreground"
          >
            <Printer className="size-5" /> Print receipt
          </button>
          <button onClick={onClose} className=" border border-border px-4 py-3.5 font-bold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-bold">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="my-2 border-t border-dashed border-border" />;
}

function barcodeBars(seed: string) {
  const widths = [1, 2, 3, 2];
  return Array.from({ length: 42 }, (_, i) => {
    const c = seed.charCodeAt(i % seed.length) + i * 7;
    return `${widths[c % widths.length]}px`;
  });
}
