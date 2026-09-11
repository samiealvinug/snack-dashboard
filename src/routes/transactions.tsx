import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SalesHistory } from "@/components/SalesHistory";
import { ReceiptModal } from "@/components/ReceiptModal";
import type { Sale } from "@/lib/types";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Sales Records — Julienne General Enterprises" },
      {
        name: "description",
        content:
          "Browse every snack sale with items, cashier, payment method and profit, then download the transactions as a CSV file.",
      },
      { property: "og:title", content: "Sales Records — Julienne General Enterprises" },
      {
        property: "og:description",
        content: "Every completed snack sale in UGX with searchable details and CSV export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const [receipt, setReceipt] = useState<Sale | null>(null);

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold">Sales Records</h1>
        <p className="text-sm font-semibold text-muted-foreground">
          Everything that has been sold — tap a row to see the full details or download the list.
        </p>
      </div>

      <SalesHistory onOpenReceipt={setReceipt} />

      {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
