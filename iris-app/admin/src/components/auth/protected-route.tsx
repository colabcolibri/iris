import { Navigate, useLocation } from "react-router-dom";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { useAuthSession } from "@/contexts/auth-session-context";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

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
