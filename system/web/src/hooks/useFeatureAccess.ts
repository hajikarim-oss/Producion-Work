// useFeatureAccess — single source of truth for "can this org do X".
//
// Plan ladder lifted from warmbly-web/src/pages/pricing.astro:
//
//   free       → no active subscription
//   starter    → $29/mo, 150 sends/day
//   grow       → $89/mo, 3k sends/day
//   business   → $329/mo, 15k sends/day + isolated sending   (featured)
//   enterprise → custom, 15k+ sends/day + isolated sending
//
// Gates here decide which dashboard features show up in the sidebar
// + which surfaces render the LockedSurface overlay. The minimum
// unlock plan should always match what we promise on the pricing
// page.
//
// A deployment with billing disabled (BILLING_PROVIDER=none, the self-host
// default) unlocks everything server-side, so it is unlocked here too and the
// subscription row is ignored: it would otherwise report a free trial that
// nothing enforces.

import useSubscription from "@/lib/api/hooks/app/subscription/useSubscription";
import useAuthConfig from "@/lib/api/hooks/auth/useAuthConfig";
import { useAppStore } from "@/stores";
import { useContext } from "react";
import { UserContext } from "@/hooks/context/user";
import { PERMISSION_BITS, hasPermission } from "@/lib/permissions";
import {
    getPlan,
    isAtLeast,
    type PlanID,
} from "@/lib/plans";

export type Plan = PlanID;

export interface FeatureAccess {
    loading: boolean;
    status?: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
    plan: PlanID;
    /** False on a deployment running without a billing provider: every gate
     *  below is open and billing/referral surfaces do not apply. */
    billing: boolean;
    /** Active subscription on any paid tier. */
    paid: boolean;
    /** Hosted workspace without a subscription: only mailboxes, the TheBoredMonkey
     *  Cloud link and settings are open; everything else waits for a plan. */
    locked: boolean;
    /** Unified inbox — free trial and Starter+. */
    hasInbox: boolean;
    /** Advanced outreach (AB tests, custom rules) — Business+. */
    hasAdvanced: boolean;
    /** Sending on infrastructure bound to this org alone — Business+. */
    hasIsolatedSending: boolean;
    /** Realtime websocket events — every tier, baseline. */
    hasRealtime: boolean;
    /** Bulk import/edit on contacts — Starter+. */
    hasBulkOps: boolean;
    /** Team invitations — Starter+. */
    hasTeam: boolean;
    /** Webhook endpoints — Business+. */
    hasWebhooks: boolean;
    /** Convenience: viewer is the current org's owner. */
    isOwner: boolean;
    /** Owner OR admin. */
    canManage: boolean;
}

import { useTBMStore } from "@/lib/tbm/tbmStore";

export default function useFeatureAccess(): FeatureAccess {
    // Role decides administration: in TBM 3-Layer architecture,
    // ADMIN (Sachin) has full management access.
    // EDITOR (Ishan), CREATIVE (Priya), and BRAND_POC (Rajesh) are
    // scoped and cannot access administrative and governance settings.
    const activeRole = useTBMStore((s) => s.activeRole);
    const isMaster = activeRole === 'ADMIN';

    return {
        loading: false,
        status: "active",
        plan: "enterprise",
        billing: false,
        paid: true,
        locked: false,
        hasInbox: true,
        hasAdvanced: true,
        hasIsolatedSending: true,
        hasRealtime: true,
        hasBulkOps: true,
        hasTeam: isMaster,
        hasWebhooks: isMaster,
        isOwner: isMaster,
        canManage: isMaster,
    };
}
