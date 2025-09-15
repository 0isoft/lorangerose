import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

export default function Header() {
  const [open, setOpen] = useState(false)
  const linkBase = "block px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
  const active = "bg-slate-900 text-white hover:bg-slate-900"

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-slate-900">Lorange Rose</Link>
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/menu" className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Menu</NavLink>
          <NavLink to="/contact" className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Contact</NavLink>
          <NavLink to="/admin" className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Admin</NavLink>
        </nav>
        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-200"
          aria-label="Toggle menu"
          onClick={() => setOpen(v => !v)}
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-slate-900 transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}></span>
            <span className={`block h-0.5 w-6 bg-slate-900 transition-opacity ${open ? "opacity-0" : ""}`}></span>
            <span className={`block h-0.5 w-6 bg-slate-900 transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}></span>
          </div>
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-2 flex flex-col">
            <NavLink to="/menu" onClick={() => setOpen(false)} className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Menu</NavLink>
            <NavLink to="/contact" onClick={() => setOpen(false)} className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Contact</NavLink>
            <NavLink to="/admin" onClick={() => setOpen(false)} className={({isActive}) => `${linkBase} ${isActive ? active : ""}`}>Admin</NavLink>
          </div>
        </nav>
      )}
    </header>
  )
}
