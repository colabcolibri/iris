import { Outlet } from "react-router-dom";
import { UmamiAnalytics } from "@/components/analytics/umami-analytics";

/** Layout das rotas públicas + demo — analytics só existe dentro deste boundary. */
export function UmamiAnalyticsLayout() {
  return (
    <>
      <UmamiAnalytics />
      <Outlet />
    </>
  );
}
