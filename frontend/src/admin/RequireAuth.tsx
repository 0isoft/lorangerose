// src/admin/RequireAuth.tsx

import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";

/**
 * @file RequireAuth.tsx
 * @brief Authentication gate component for admin routes.
 * @details
 *   - Checks if the current user is authenticated by querying /api/auth/me.
 *   - Renders a loading state while checking, redirects to login if unauthenticated,
 *     or renders the protected children if authenticated.
 */

/**
 * @typedef RequireAuthProps
 * @property {JSX.Element} children - The protected component tree to render on successful authentication.
 */

/**
 * @brief Protects admin pages by ensuring authentication.
 * @details
 *   - On mount, fetches the current authentication status.
 *   - While checking, displays a "Checking…" message.
 *   - If unauthenticated, redirects to /admin/login, preserving the requested location.
 *   - If authenticated, renders the supplied children.
 * @param {RequireAuthProps} props - The props containing children elements to render when authed.
 * @returns {JSX.Element} The rendered children, a loading message, or a redirect depending on authentication state.
 */
export default function RequireAuth({ children }: { children: JSX.Element }) {
  /**
   * @var status
   * @brief Tracks authentication checking state:
   *   - "checking": Currently verifying user's auth status
   *   - "authed":    User is authenticated
   *   - "guest":     User is not authenticated
   */
  const [status, setStatus] = useState<"checking" | "authed" | "guest">("checking");

  /**
   * @var location
   * @brief Current location from React Router, to redirect back after login
   */
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
