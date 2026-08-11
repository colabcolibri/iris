import { Navigate } from "react-router-dom";
import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { useAuthSession } from "@/contexts/auth-session-context";
import { ROUTES } from "@/lib/routes";

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { status } = useAuthSession();

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "authenticated") {
    return <Navigate to={ROUTES.admin.root} replace />;
  }

  return children;
}
