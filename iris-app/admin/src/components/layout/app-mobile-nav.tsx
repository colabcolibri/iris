import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandLogo } from "@/components/layout/brand-logo";
import { AppNavigation } from "@/components/layout/app-navigation";
import type { AppView } from "@/components/layout/app-sidebar";

type AppMobileNavProps = {
  view?: AppView;
  onViewChange?: (view: AppView) => void;
};

export function AppMobileNav({ view, onViewChange }: AppMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 md:hidden"
            aria-label="Abrir menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-70 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="border-b border-sidebar-border px-4 py-5 text-left">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <SheetTitle className="font-display text-2xl text-sidebar-foreground">Iris</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex h-[calc(100%-5rem)] flex-col p-4">
          <AppNavigation
            view={view}
            onViewChange={onViewChange}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
