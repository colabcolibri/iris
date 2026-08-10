import { Loader2 } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthSession } from "@/contexts/auth-session-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-label="Verificando sessão" />
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuthSession();
  const location = useLocation();

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "anonymous") {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return children;
}
