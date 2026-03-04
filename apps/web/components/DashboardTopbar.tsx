'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface DashboardTopbarProps {
  workspaceName: string;
}

export function DashboardTopbar({ workspaceName }: DashboardTopbarProps) {
  return (
    <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">{workspaceName}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white hover:ring-2 hover:ring-emerald-500 transition-all">
            {getInitials(workspaceName)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-slate-300">
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-red-400">
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
