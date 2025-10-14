// src/App.tsx
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";


import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import Menu from "./pages/Menu";
import Gallery from "./pages/Gallery";
import { useLocation } from 'react-router-dom';

import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import RequireAuth from "./admin/RequireAuth";
import { I18nProvider } from "@/i18n";

import Logo from "@/assets/essentials/orangerose_logo-removebg-preview.png";

function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        path: location.pathname,
      }),
    }).catch(() => {}); // silently fail
  }, [location.pathname]);
}

export default function App() {
  usePageTracking(); //enable

  useEffect(() => {
    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") || document.createElement("link");

    link.type = "image/png";
    link.rel = "icon";
    link.href = Logo; // this is the imported image, Vite will bundle it

    document.head.appendChild(link);
  }, []);
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
