import React from 'react';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { TBMRole } from '@/lib/tbm/types';
import { ShieldCheck, User, Users, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ROLE_CONFIGS: Record<
  TBMRole,
  { label: string; name: string; icon: React.ReactNode; tone: string; desc: string }
> = {
  ADMIN: {
    label: 'Master Admin',
    name: 'Sachin',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />,
    tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Layer 1: Full CRUD on all projects, brands & automations',
  },
  EDITOR: {
    label: 'Editor',
    name: 'Ishan',
    icon: <User className="w-3.5 h-3.5 text-blue-500" />,
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    desc: 'Layer 2: Edit only status/round/notes on assigned reels',
  },
  CREATIVE: {
    label: 'Creative Lead',
    name: 'Priya',
    icon: <Users className="w-3.5 h-3.5 text-purple-500" />,
    tone: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Layer 2: Concept & script production tasks',
  },
  BRAND_POC: {
    label: 'Brand Partner',
    name: 'Rajesh (Atomberg)',
    icon: <span className="text-xs">🏢</span>,
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Layer 3: Client portal, raw stages & internal notes hidden',
  },
};

export function RoleSwitcher() {
  const activeRole = useTBMStore((s) => s.activeRole);
  const setActiveRole = useTBMStore((s) => s.setActiveRole);
  const cfg = ROLE_CONFIGS[activeRole];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-7 px-2.5 rounded-md inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors border border-slate-200 hover:border-slate-300 bg-white shadow-2xs cursor-pointer"
        >
          {cfg.icon}
          <span className="font-semibold text-slate-900">{cfg.name}</span>
          <span className="text-slate-400 font-normal">({cfg.label})</span>
          <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1">
        <div className="px-2 py-1.5 text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider">
          Active Role Simulator (3 Layers)
        </div>
        {(Object.keys(ROLE_CONFIGS) as TBMRole[]).map((role) => {
          const item = ROLE_CONFIGS[role];
          const isSelected = activeRole === role;
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => setActiveRole(role)}
              className="flex items-start gap-2.5 p-2 cursor-pointer rounded-md hover:bg-slate-50"
            >
              <div className="mt-0.5">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-xs">
                    {item.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] bg-slate-900 text-white font-medium px-1.5 py-0.2 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {item.desc}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
