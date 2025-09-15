// src/App.tsx
import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import Menu from "./pages/Menu";
import Gallery from "./pages/Gallery";

// ⬇️ import directly (no lazy)
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import RequireAuth from "./admin/RequireAuth";
import { I18nProvider } from "@/i18n";

export default function App() {
  return (
    <div className="min-h-screen w-full bg-[#f3ecdc] text-[#0b0b0b]">
      <I18nProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/gallery" element={<Gallery/>} />
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
      </Routes>
      </I18nProvider>
    </div>
  );
}
