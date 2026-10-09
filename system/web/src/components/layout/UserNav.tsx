// User menu — bottom of the sidebar.
//
// Moved off the shadcn DropdownMenu onto the same PopoverMenu primitive
// every other dropdown in the dashboard uses (folders, sort, accounts,
// org switcher). One animation curve, one surface, one set of styles.
//
// Opens upward (side="top") from the trigger so the popover settles up
// from the bottom of the sidebar instead of falling off-screen.

import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    LogOutIcon,
    SettingsIcon,
} from "lucide-react";
import { useAppStore } from "@/stores";
import useLogout from "@/lib/api/hooks/auth/useLogout";
import { UserContext } from "@/hooks/context/user";
import useFeatureAccess from "@/hooks/useFeatureAccess";
import {
    PopoverMenu,
    PopoverMenuContent,
    PopoverMenuItem,
    PopoverMenuSeparator,
    PopoverMenuTrigger,
} from "@/components/ui/popover-menu";

import { useTBMStore } from "@/lib/tbm/tbmStore";

const ROLE_PERSONAS = {
    ADMIN: {
        name: "Sachin",
        role: "Master Admin",
        email: "sachin@theboredmonkey.com",
        initials: "SA",
        bg: "bg-indigo-600",
    },
    EDITOR: {
        name: "Ishan",
        role: "Lead Editor",
        email: "ishan@theboredmonkey.com",
        initials: "IS",
        bg: "bg-blue-600",
    },
    CREATIVE: {
        name: "Priya",
        role: "Creative Lead",
        email: "priya@theboredmonkey.com",
        initials: "PR",
        bg: "bg-purple-600",
    },
    BRAND_POC: {
        name: "Rajesh",
        role: "Brand Partner (Atomberg)",
        email: "rajesh@atomberg.com",
        initials: "RA",
        bg: "bg-amber-600",
    },
};

export function UserNav() {
    const navigate = useNavigate();
    const activeRole = useTBMStore((s) => s.activeRole);
    const persona = ROLE_PERSONAS[activeRole] || ROLE_PERSONAS.ADMIN;
    const access = useFeatureAccess();
    const logoutMutation = useLogout();

    const handleLogout = async () => {
        await logoutMutation.mutateAsync();
        toast.success("Signed out successfully");
        navigate("/auth/login?force=true", { replace: true });
    };

    const userEmail = persona.email;
    const displayName = `${persona.name} (${persona.role})`;
    const initials = persona.initials;

    return (
        <PopoverMenu side="top" align="start">
            <PopoverMenuTrigger asChild>
                <button className="flex items-center gap-2.5 mx-3 my-2 px-1.5 py-1 rounded-md hover:bg-slate-200/40 transition-colors w-[calc(100%-1.5rem)] cursor-pointer">
                    <div className={`w-7 h-7 rounded-full ${persona.bg} flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}>
                        <span className="text-[11px] font-semibold text-white leading-none">
                            {initials}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-[13px] text-slate-900 truncate">
                            {displayName}
                        </div>
                        <div className="text-[10.5px] text-slate-500 truncate">
                            {userEmail}
                        </div>
                    </div>
                </button>
            </PopoverMenuTrigger>

            <PopoverMenuContent minWidth={232}>
                {/* Identity block — same name/email row but inside the
                    PopoverMenu chrome so it inherits the consistent
                    hairline border + shadow. */}
                <div className="px-3 py-2">
                    <div className="text-[12.5px] font-medium text-slate-900 truncate">
                        {displayName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono">
                        {userEmail}
                    </div>
                </div>
                {access.canManage && (
                    <>
                        <PopoverMenuSeparator />
                        <PopoverMenuItem
                            onSelect={() => navigate("/app/settings")}
                            icon={<SettingsIcon className="w-3 h-3" />}
                        >
                            Settings
                        </PopoverMenuItem>
                    </>
                )}
                <PopoverMenuSeparator />
                <PopoverMenuItem
                    onSelect={handleLogout}
                    icon={<LogOutIcon className="w-3 h-3" />}
                    disabled={logoutMutation.isPending}
                    danger
                >
                    {logoutMutation.isPending ? "Signing out…" : "Log out"}
                </PopoverMenuItem>
            </PopoverMenuContent>
        </PopoverMenu>
    );
}
