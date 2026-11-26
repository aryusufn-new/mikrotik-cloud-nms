import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Server, 
  GitBranch, 
  Activity, 
  Plus, 
  FolderTree, 
  SlidersHorizontal, 
  ChevronDown,
  LogOut,
  User
} from 'lucide-react';

export default function Sidebar({ deviceCount = 4, onOpenAddRouter, onOpenAddGroup }) {
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const mainNav = [
    { name: 'Ringkasan', path: '/', icon: LayoutGrid },
    { name: 'Devices', path: '/devices', icon: Server, badge: deviceCount },
    { name: 'Topologi', path: '/topologi', icon: GitBranch },
    { name: 'Riwayat koneksi', path: '/riwayat', icon: Activity },
  ];

  const manageNav = [
    { name: 'Tambah router', action: onOpenAddRouter, icon: Plus, isAction: true },
    { name: 'Grup perangkat', path: '/grup', icon: FolderTree },
  ];

  return (
    <aside className="w-64 min-w-[16rem] h-full flex flex-col justify-between bg-white rounded-3xl p-5 shadow-sm border border-slate-100 select-none">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#d96734] flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">MikroTik</h1>
            <p className="text-xs font-semibold text-[#d96734]">Cloud NMS</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/devices' && location.pathname.startsWith('/remote'));

            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#d96734] text-white shadow-sm shadow-orange-900/10'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Section: KELOLA */}
        <div className="mt-8 mb-2 px-3">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">KELOLA</p>
        </div>

        <div className="space-y-1.5">
          {manageNav.map((item) => {
            const Icon = item.icon;
            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-all text-left"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </button>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#d96734] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom section: Settings & Account */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span>Pengaturan</span>
        </NavLink>

        <div className="relative">
          <button
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="text-slate-700 text-xs font-semibold">Akun saya</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {accountMenuOpen && (
            <div className="absolute bottom-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-semibold text-slate-800">Admin NMS</p>
                <p className="text-slate-400 text-[11px]">admin@mikrotik.lan</p>
              </div>
              <button 
                onClick={() => setAccountMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-xl mt-1"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Profil saya</span>
              </button>
              <button 
                onClick={() => setAccountMenuOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

