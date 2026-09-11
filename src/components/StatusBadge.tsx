import { STATUS_LABEL, stockStatus } from "@/lib/selectors";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ product, className }: { product: Product; className?: string }) {
  const status = stockStatus(product);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5  px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        status === "in" && "bg-success-soft text-success",
        status === "low" && "bg-warn-soft text-warn",
        status === "out" && "bg-danger-soft text-danger",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 ",
          status === "in" && "bg-success",
          status === "low" && "bg-warn",
          status === "out" && "bg-danger",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}
