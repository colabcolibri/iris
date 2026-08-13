import type { FieldSource, ProductFieldKey } from "@/lib/types";
import {
  FIELD_SOURCE_LABELS,
  PRODUCT_FIELD_KEYS,
  PRODUCT_FIELD_LABELS,
} from "@/lib/product-field-keys";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type StoreFieldPoliciesFormProps = {
  values: Partial<Record<ProductFieldKey, FieldSource>>;
  disabled?: boolean;
  onChange: (fieldKey: ProductFieldKey, source: FieldSource) => void;
  className?: string;
};

export function StoreFieldPoliciesForm({
  values,
  disabled = false,
  onChange,
  className,
}: StoreFieldPoliciesFormProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">
        Padrão global para produtos vinculados a esta loja. Overrides por produto
        têm precedência.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PRODUCT_FIELD_KEYS.map((fieldKey) => (
          <div key={fieldKey} className="space-y-2">
            <Label className="text-sm font-semibold">
              {PRODUCT_FIELD_LABELS[fieldKey]}
            </Label>
            <Select
              value={values[fieldKey] ?? "iris"}
              onValueChange={(value) => {
                if (value === "iris" || value === "store" || value === "disabled") {
                  onChange(fieldKey, value);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger className="h-10 w-full bg-background">
                <SelectValue>
                  {FIELD_SOURCE_LABELS[values[fieldKey] ?? "iris"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {(Object.keys(FIELD_SOURCE_LABELS) as FieldSource[]).map((source) => (
                  <SelectItem key={source} value={source}>
                    {FIELD_SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
