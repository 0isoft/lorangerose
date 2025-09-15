// src/pages/admin/Login.tsx
import { useState } from "react";
import Logo from "@/assets/essentials/orangerose_logo-removebg-preview.png";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const location = useLocation() as any;
  const next = location.state?.from?.pathname || "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pwd }),
    });
    if (res.ok) {
      nav(next, { replace: true });
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-[#F7EBD9] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl border border-[#4C0C27]/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <img src={Logo} className="h-10" />
          <h1 className="font-legacy text-2xl tracking-wide">Admin</h1>
        </div>
        <label className="block text-sm mb-2">Email</label>
        <input
          className="w-full mb-4 px-3 py-2 rounded-lg border border-[#4C0C27]/30 bg-white"
          value={email} onChange={e=>setEmail(e.target.value)} type="email" required
        />
        <label className="block text-sm mb-2">Password</label>
        <input
          className="w-full mb-4 px-3 py-2 rounded-lg border border-[#4C0C27]/30 bg-white"
          value={pwd} onChange={e=>setPwd(e.target.value)} type="password" required
        />
        {err && <div className="text-[#C81D25] text-sm mb-3">{err}</div>}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[#C81D25] text-white font-semibold hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
