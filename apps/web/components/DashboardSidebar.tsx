'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  CheckCircle,
  Key,
  Settings,
  CreditCard,
  ShieldCheck,
  Menu,
  X,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: Home },
  { label: 'Policies', href: '/dashboard/policies', icon: FileText },
  { label: 'Acceptances', href: '/dashboard/acceptances', icon: CheckCircle },
  { label: 'Campaigns', href: '/dashboard/campaigns', icon: RefreshCw },
  { label: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface SidebarNavProps {
  workspaceName: string;
  onClose?: () => void;
}

function SidebarNav({ workspaceName, onClose }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-800">
        <ShieldCheck className="h-6 w-6 text-emerald-400" />
        <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
          TermsKit
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: workspace + avatar */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 py-2 px-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {getInitials(workspaceName)}
          </div>
          <span className="text-sm text-slate-300 truncate">{workspaceName}</span>
        </div>
      </div>
    </div>
  );
}

interface DashboardSidebarProps {
  workspaceName: string;
}

export function DashboardSidebar({ workspaceName }: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 fixed left-0 top-0 h-full flex-col bg-slate-900 border-r border-slate-800 z-30">
        <SidebarNav workspaceName={workspaceName} />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 h-full bg-slate-900 border-r border-slate-800">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 p-2 text-slate-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav workspaceName={workspaceName} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
