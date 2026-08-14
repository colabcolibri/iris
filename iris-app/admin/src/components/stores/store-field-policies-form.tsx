import type { FieldSource, ProductFieldKey } from "@/lib/types";
import { PRODUCT_FIELD_KEYS } from "@/lib/product-field-keys";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDomainMessages } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type StoreFieldPoliciesFormProps = {
  values: Partial<Record<ProductFieldKey, FieldSource>>;
  disabled?: boolean;
  onChange: (fieldKey: ProductFieldKey, source: FieldSource) => void;
  className?: string;
};

const FIELD_MESSAGE_KEYS = {
  name: "name",
  short_description: "shortDescription",
  long_description: "longDescription",
  price: "price",
  url: "url",
  image_url: "imageUrl",
  sku: "sku",
} as const;

export function StoreFieldPoliciesForm({
  values,
  disabled = false,
  onChange,
  className,
}: StoreFieldPoliciesFormProps) {
  const productsMsg = useDomainMessages("products");
  const fieldSources = productsMsg.fieldSources;
  const fieldLabels = productsMsg.store.fields;

  function fieldLabel(fieldKey: ProductFieldKey): string {
    const key = FIELD_MESSAGE_KEYS[fieldKey];
    return fieldLabels[key as keyof typeof fieldLabels] ?? fieldKey;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-sm text-muted-foreground">
        {productsMsg.stores.detail.globalPoliciesHint}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {PRODUCT_FIELD_KEYS.map((fieldKey) => (
          <div key={fieldKey} className="space-y-2">
            <Label className="text-sm font-semibold">{fieldLabel(fieldKey)}</Label>
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
                  {fieldSources[values[fieldKey] ?? "iris"]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {(Object.keys(fieldSources) as FieldSource[]).map((source) => (
                  <SelectItem key={source} value={source}>
                    {fieldSources[source]}
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
