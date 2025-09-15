// src/admin/RequireAuth.tsx
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!alive) return;
        setStatus(res.ok ? "authed" : "guest");
      } catch {
        if (!alive) return;
        setStatus("guest");
      }
    })();
    return () => { alive = false; };
  }, []);

  if (status === "checking") return <div className="p-6">Checking…</div>;
  if (status === "guest") return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
}
