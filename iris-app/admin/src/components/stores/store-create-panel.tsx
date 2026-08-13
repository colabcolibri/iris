import { Loader2, Plus, Search } from "lucide-react";
import { PagePanel } from "@/components/templates/page-panel";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { YampiMerchantOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type StoreCreatePanelProps = {
  label: string;
  alias: string;
  merchants: YampiMerchantOption[];
  userToken: string;
  userSecretKey: string;
  creating: boolean;
  discovering: boolean;
  onLabelChange: (value: string) => void;
  onAliasChange: (value: string) => void;
  onUserTokenChange: (value: string) => void;
  onUserSecretKeyChange: (value: string) => void;
  onDiscover: () => void;
  onSubmit: () => void;
};

export function StoreCreatePanel({
  label,
  alias,
  merchants,
  userToken,
  userSecretKey,
  creating,
  discovering,
  onLabelChange,
  onAliasChange,
  onUserTokenChange,
  onUserSecretKeyChange,
  onDiscover,
  onSubmit,
}: StoreCreatePanelProps) {
  const canDiscover = Boolean(userToken.trim() && userSecretKey.trim());
  const showMerchantSelect = merchants.length > 0;

  return (
    <PagePanel className="flex min-h-0 flex-1 flex-col border-0 bg-transparent md:rounded-none md:border-l md:border-border/60 md:bg-card">
      <PagePanel.Header
        title="Conectar loja Yampi"
        description="Informe token e secret, busque as lojas da conta e selecione o alias retornado pela Yampi."
      />
      <PagePanel.Body>
        <PageScrollArea contentClassName="space-y-5 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="store-label" className="text-sm font-semibold">
              Nome da conexão
            </Label>
            <Input
              id="store-label"
              value={label}
              onChange={(event) => onLabelChange(event.target.value)}
              placeholder="Ex.: Loja principal"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-user-token" className="text-sm font-semibold">
              User Token
            </Label>
            <Input
              id="store-user-token"
              type="password"
              autoComplete="off"
              value={userToken}
              onChange={(event) => onUserTokenChange(event.target.value)}
              className="h-11 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="store-user-secret" className="text-sm font-semibold">
              User Secret Key
            </Label>
            <Input
              id="store-user-secret"
              type="password"
              autoComplete="off"
              value={userSecretKey}
              onChange={(event) => onUserSecretKeyChange(event.target.value)}
              className="h-11 font-mono"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!canDiscover || discovering}
            className="gap-2"
            onClick={onDiscover}
          >
            {discovering ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Buscar lojas da conta
          </Button>

          {showMerchantSelect ? (
            <div className="space-y-2">
              <Label htmlFor="store-alias" className="text-sm font-semibold">
                Alias Yampi
              </Label>
              <Select value={alias} onValueChange={(value) => value && onAliasChange(value)}>
                <SelectTrigger id="store-alias" className="h-11 w-full bg-background">
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent align="start">
                  {merchants.map((merchant) => (
                    <SelectItem key={merchant.alias} value={merchant.alias}>
                      {merchant.name} ({merchant.alias})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O alias vem do `auth/me` da Yampi e é usado em `api.dooki.com.br/v2/{alias}/…`.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="store-alias-manual" className="text-sm font-semibold">
                Alias Yampi (opcional)
              </Label>
              <Input
                id="store-alias-manual"
                value={alias}
                onChange={(event) => onAliasChange(event.target.value)}
                placeholder="Preencha após buscar ou informe manualmente"
                className="h-11 font-mono"
              />
            </div>
          )}
        </PageScrollArea>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/60 p-4 sm:px-6">
          <Button type="button" disabled={creating} onClick={onSubmit}>
            {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" />}
            Conectar loja
          </Button>
        </div>
      </PagePanel.Body>
    </PagePanel>
  );
}

export function StoreInboxNewItem({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40",
        selected && "bg-muted/60",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-background text-muted-foreground">
        <Plus className="size-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Nova conexão Yampi</p>
        <p className="text-xs text-muted-foreground">Adicionar loja virtual</p>
      </div>
    </button>
  );
}
