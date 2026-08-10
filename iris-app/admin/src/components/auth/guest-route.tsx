import { Navigate } from "react-router-dom";
import { useAuthSession } from "@/contexts/auth-session-context";

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { status } = useAuthSession();

  if (status === "loading") {
    return null;
  }

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return children;
}
