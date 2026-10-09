// Sidebar for the sky-chrome shell.
//
// Brae-density structure: small tracked-uppercase section labels, h-8
// nav rows, hairline dividers between sections. The header slot is
// the LivePanel — a small ambient telemetry card that replaces the
// generic "+ New Campaign" pill. Cold-email work is always-on; the
// sidebar should reflect that rather than nag with a CTA.

import { Link, useLocation } from "react-router-dom";
import {
    ClipboardListIcon,
    BarChart3Icon,
    CableIcon,
    CalendarClockIcon,
    CheckSquareIcon,
    CircleDollarSignIcon,
    FileTextIcon,
    FlameIcon,
    GitBranchIcon,
    InboxIcon,
    KeyIcon,
    LayoutDashboardIcon,
    ListChecksIcon,
    type LucideIcon,
    MailIcon,
    MegaphoneIcon,
    SettingsIcon,
    ShieldCheckIcon,
    UsersIcon,
    LockIcon,
    XIcon,
    ZapIcon,
    FolderKanbanIcon,
    ColumnsIcon,
    AlertTriangleIcon,
    Building2Icon,
    UserCheckIcon,
    ExternalLinkIcon,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { useTBMStore } from "@/lib/tbm/tbmStore";
import { ProjectStage } from "@/lib/tbm/types";
import { useAppStore } from "@/stores";
import useFeatureAccess from "@/hooks/useFeatureAccess";
import { usePermission, type PermissionKey } from "@/hooks/usePermission";
import { useUpgradeDialog } from "@/hooks/context/upgrade";
import { PLAN_ACCENT_CLASSES, getPlan, type PlanID } from "@/lib/plans";
import AccessLockedDialog from "./AccessLockedDialog";
import useCampaigns from "@/lib/api/hooks/app/campaigns/useCampaigns";
import useEmails from "@/lib/api/hooks/app/emails/useEmails";
import useTasksSummary from "@/lib/api/hooks/app/crm/tasks/useTasksSummary";
import useMeetingsSummary from "@/lib/api/hooks/app/meetings/useMeetingsSummary";
import useDealsSummary from "@/lib/api/hooks/app/crm/deals/useDealsSummary";
import { EMPTY_TASK_SEARCH } from "@/lib/api/models/app/crm/SearchTasks";
import { EMPTY_DEAL_SEARCH } from "@/lib/api/models/app/crm/SearchDeals";
import useSearchContacts from "@/lib/api/hooks/app/contacts/useSearchContacts";
import type SearchContacts from "@/lib/api/models/app/contacts/SearchContacts";
import usePipelines from "@/lib/api/hooks/app/crm/pipelines/usePipelines";
import useTemplates from "@/lib/api/hooks/app/templates/useTemplates";
import useUsageOverview from "@/lib/api/hooks/app/analytics/useUsageOverview";
import useDashboard from "@/lib/api/hooks/app/analytics/useDashboard";
import mailboxDisplayStatus from "@/lib/mailboxStatus";
import useAPIKeys from "@/lib/api/hooks/app/api-keys/useAPIKeys";
import useIntegrationConnections from "@/lib/api/hooks/app/integrations/useIntegrationConnections";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import AdvisorNavBadge from "@/components/app/advisor/AdvisorNavBadge";
import type { AdvisorSurface } from "@/lib/api/models/app/advisor/Advisor";
import { UserNav } from "./UserNav";
import { Logo } from "@/components/svg";
import { cn } from "@/lib/utils";

const CONTACTS_COUNT_SEARCH: SearchContacts = {
    query: "",
    custom_field_filters: [],
    campaign_ids: [],
    sort_by: "created_at",
    reverse: false,
};

interface NavItem {
    title: string;
    url: string;
    icon: LucideIcon;
    badgeStoreKey?: "unseenCount";
    requires?: "inbox" | "advanced" | "subscription";
    rolesAllowed?: "manage";
    permission?: PermissionKey;
    permissionLabel?: string;
    advisorSurface?: AdvisorSurface;
    indicator?:
        | "campaigns"
        | "accounts"
        | "tasks"
        | "contacts"
        | "deals"
        | "pipelines"
        | "meetings"
        | "templates"
        | "analytics"
        | "apikeys"
        | "integrations";
}

const REQUIRES_TO_MIN_PLAN: Record<NonNullable<NavItem["requires"]>, PlanID> = {
    inbox: "starter",
    subscription: "starter",
    advanced: "business",
};

interface NavSection {
    label: string;
    items: NavItem[];
}

const topItems: NavItem[] = [
    {
        title: "Dashboard",
        url: "/app/dashboard",
        icon: LayoutDashboardIcon,
    },
];

const sections: NavSection[] = [
    {
        label: "Project Management",
        items: [
            { title: "All Projects", url: "/app/projects", icon: FolderKanbanIcon },
            { title: "Pipeline (Kanban)", url: "/app/projects/pipeline", icon: ColumnsIcon },
            { title: "My Tasks", url: "/app/projects/my-tasks", icon: UserCheckIcon },
            { title: "SLA Overdue Watch", url: "/app/projects/overdue", icon: AlertTriangleIcon },
            { title: "Brands & Retainers", url: "/app/projects/brands", icon: Building2Icon },
            { title: "Client Review Portal", url: "/app/projects/portal", icon: ExternalLinkIcon },
        ],
    },
    {
        label: "System & Governance",
        items: [
            { title: "Automation Workflows", url: "/app/automations", icon: ZapIcon },
            { title: "Workspace Members", url: "/app/settings/members", icon: UsersIcon },
            { title: "Transition Audit Log", url: "/app/audit", icon: ListChecksIcon },
            { title: "Settings", url: "/app/settings/workspace", icon: SettingsIcon },
        ],
    },
];

function NavRow({ item }: { item: NavItem }) {
    const { pathname } = useLocation();
    const unseen = useAppStore((s) => s.unseenCount);
    const access = useFeatureAccess();
    const hasItemPermission = usePermission(item.permission ?? "VIEW_CAMPAIGNS");
    const [deniedOpen, setDeniedOpen] = useState(false);
    const upgradeDialog = useUpgradeDialog();
    const active =
        pathname === item.url || pathname.startsWith(item.url + "/");
    const badge = item.badgeStoreKey === "unseenCount" ? unseen : undefined;

    // Role-gated items disappear from the sidebar for users that
    // can't access them, instead of showing a lock — these are
    // administrative tools, not premium features to tease.
    if (item.rolesAllowed === "manage" && !access.canManage) return null;

    // Permission-gated items the member lacks: render a locked row that pops
    // an access dialog on click, so the feature is visibly unavailable (a
    // lock) rather than a blank/empty page that reads as "no data".
    // All features unlocked
    const accessDenied = false;
    const locked = false;
    const minPlan: any = null;
    const planBadge: any = null;

    return (
        <Link
            to={item.url}
            title={planBadge ? `${item.title} · ${planBadge.label} plan` : undefined}
            className={cn(
                "group mx-2 flex items-center gap-2.5 px-2.5 h-7 rounded-md text-[12.5px] transition-colors duration-100",
                active
                    ? "bg-[#18181B] text-white font-medium shadow-xs"
                    : locked
                        ? "text-slate-400 hover:text-slate-700 hover:bg-stone-200/50"
                        : "text-slate-600 hover:text-slate-900 hover:bg-stone-200/60",
            )}
        >
            <item.icon
                className={cn(
                    "w-[14px] h-[14px] shrink-0 transition-colors",
                    active
                        ? "text-[#FFE600]"
                        : locked
                            ? "text-slate-300 group-hover:text-slate-500"
                            : "text-slate-400 group-hover:text-slate-600",
                )}
                strokeWidth={active ? 2 : 1.6}
            />
            {/* min-w-0 lets the label shrink/truncate so the count cluster (and its
                separator) is never pushed off the row — longer labels like
                "Campaigns"/"Accounts" used to clip it at narrower widths. */}
            <span className="truncate flex-1 min-w-0">{item.title}</span>
            {item.advisorSurface && !locked && <AdvisorNavBadge surface={item.advisorSurface} />}
            {item.indicator === "campaigns" && !locked && <CampaignActivity />}
            {item.indicator === "accounts" && !locked && <MailboxActivity />}
            {item.indicator === "tasks" && !locked && <TasksActivity />}
            {item.indicator === "meetings" && !locked && <MeetingsActivity />}
            {item.indicator === "contacts" && !locked && <ContactsActivity />}
            {item.indicator === "deals" && !locked && <DealsActivity />}
            {item.indicator === "pipelines" && !locked && <PipelinesActivity />}
            {item.indicator === "templates" && !locked && <TemplatesActivity />}
            {item.indicator === "analytics" && !locked && <AnalyticsActivity />}
            {item.indicator === "apikeys" && !locked && <ApiKeysActivity />}
            {item.indicator === "integrations" && !locked && <IntegrationsActivity />}
            {planBadge ? (
                <span
                    className={cn(
                        "h-4 px-1.5 rounded text-[9.5px] font-semibold uppercase tracking-[0.06em] border inline-flex items-center",
                        planBadge.classes,
                    )}
                >
                    {planBadge.label}
                </span>
            ) : (
                badge != null && badge > 0 && (
                    <span className="text-[10px] font-medium bg-red-500 text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 tabular-nums">
                        {badge > 99 ? "99+" : badge}
                    </span>
                )
            )}
        </Link>
    );
}

// compactN renders large counts tersely (12.3k, 1.2M) so a headline number like
// total emails sent fits a nav row.
function compactN(n: number): string {
    const v = Math.round(n);
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 10_000) return `${Math.round(v / 1000)}k`;
    if (v >= 1_000) return `${(v / 1000).toFixed(1)}k`;
    return String(v);
}

// The "how many" total at the end of a nav row. Light slate so it reads as
// ambient metadata (lifting a touch on row hover), but visible, and it tweens
// (AnimatedNumber) on change. An optional `glyph` — a small coloured activity
// motif (sending dot-grid, warming flame, overdue ping) — sits in front to flag
// a live state without stealing the number, which stays the plain total. Hidden
// only when there's truly nothing to show.
const COUNT_LIGHT =
    "text-[10.5px] font-medium tabular-nums leading-none text-slate-300 transition-colors group-hover:text-slate-500";

function TabStat({
    total,
    glyph,
    format = compactN,
    title,
}: {
    total: number;
    glyph?: ReactNode;
    format?: (n: number) => string;
    title?: string;
}) {
    // Always render the number (including 0) so every data tab visibly carries a
    // count instead of going blank — it just tweens up as the query resolves.
    return (
        <span
            className="ml-auto inline-flex items-center gap-1.5 shrink-0"
            title={title}
        >
            {glyph}
            <AnimatedNumber value={total} format={format} className={COUNT_LIGHT} />
        </span>
    );
}

// TabDualStat shows TWO numbers on a row: the light "how many in total" (the calm
// baseline, e.g. all campaigns / all mailboxes) plus, when there's a live subset,
// a coloured sub-count with its motif (e.g. how many are sending / warming). Both
// tween. The total stays the faint baseline; the active subset is the coloured
// attention.
function TabDualStat({
    total,
    active,
    activeGlyph,
    activeClass,
    title,
}: {
    total: number;
    active: number;
    activeGlyph: ReactNode;
    activeClass: string;
    title?: string;
}) {
    return (
        <span
            className="ml-auto inline-flex items-center gap-2.5 shrink-0"
            title={title}
        >
            <AnimatedNumber value={total} format={compactN} className={COUNT_LIGHT} />
            {/* Hairline divider so the light total and the active count read as two
                separate values. Always present on a dual row so every one of them
                (campaigns, accounts, tasks) shows both numbers consistently. */}
            <span className="h-3 w-px shrink-0 bg-slate-200" aria-hidden />
            <span
                className={`inline-flex items-center gap-1 ${active > 0 ? activeClass : "text-slate-300"}`}
            >
                {/* The motif (sending dot-grid / warming flame / overdue ping) only
                    appears when there's actually a live subset; at 0 it's a calm
                    muted number. */}
                {active > 0 && activeGlyph}
                <AnimatedNumber
                    value={active}
                    format={compactN}
                    className="text-[10.5px] font-semibold tabular-nums leading-none"
                />
            </span>
        </span>
    );
}

// CampaignActivity is the ambient, realtime indicator on the Campaigns nav row.
// While campaigns are sending it escalates to a sky 3x3 dot-grid + a live count;
// otherwise it shows a faint total of all campaigns. The counts come from the
// shared campaigns-list cache, which the realtime layer invalidates on campaign
// events, so it stays live without a refresh.
function CampaignActivity() {
    const { campaigns } = useCampaigns({ query: "", folder: "" });
    const active = useMemo(
        () => campaigns.filter((c) => c.status === "active").length,
        [campaigns],
    );
    return (
        <TabDualStat
            total={campaigns.length}
            active={active}
            activeClass="text-slate-900"
            activeGlyph={<span className="campaign-grid" aria-hidden />}
            title={`${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}${active > 0 ? `, ${active} sending now` : ""}`}
        />
    );
}

// MailboxActivity is the Accounts-row indicator — deliberately a DIFFERENT
// motif than the campaigns dot-grid: a flickering flame + count of mailboxes
// warming up right now (warmup enabled and not paused). Hidden when none are
// warming. Counts come from the shared emails-list cache, which the realtime
// layer invalidates on account/warmup events, so it stays live.
function MailboxActivity() {
    const { emails } = useEmails({ query: "", tag: "" });
    const warming = useMemo(
        () => emails.filter((e) => !!e.warmup && !e.warmup_paused_at).length,
        [emails],
    );
    return (
        <TabDualStat
            total={emails.length}
            active={warming}
            activeClass="text-orange-500"
            activeGlyph={
                <FlameIcon className="w-3.5 h-3.5 flame-flicker" strokeWidth={2.2} />
            }
            title={`${emails.length} mailbox${emails.length === 1 ? "" : "es"}${warming > 0 ? `, ${warming} warming up` : ""}`}
        />
    );
}

// TasksActivity is the Tasks-row indicator — its own motif again. Overdue is the
// urgent state (a soft red ping + count); when nothing is overdue it falls back
// to a quiet count of open tasks (todo) so the row still tells you how much work
// is waiting instead of going blank. Counts are SERVER aggregates (useTasksSummary)
// so "how many" is correct over the whole set, not a truncated page, and the
// realtime layer invalidates ["crm","tasks"] so they stay live. The number tweens
// (AnimatedNumber) when it changes.
function TasksActivity() {
    const { data } = useTasksSummary(EMPTY_TASK_SEARCH);
    const overdue = data?.overdue_count ?? 0;
    const todo = (data?.pending_count ?? 0) + (data?.in_progress_count ?? 0);
    return (
        <TabDualStat
            total={todo}
            active={overdue}
            activeClass="text-red-600"
            activeGlyph={
                <span className="relative inline-flex shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" />
                </span>
            }
            title={`${todo} open task${todo === 1 ? "" : "s"}${overdue > 0 ? `, ${overdue} overdue` : ""}`}
        />
    );
}

// MeetingsActivity — upcoming booked calls, with a live sky pulse on the ones
// happening today (a meeting today is the "act now" subset, like overdue tasks).
function MeetingsActivity() {
    const { data } = useMeetingsSummary();
    const upcoming = data?.upcoming ?? 0;
    const today = data?.today ?? 0;
    return (
        <TabDualStat
            total={upcoming}
            active={today}
            activeClass="text-slate-900"
            activeGlyph={
                <span className="relative inline-flex shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                </span>
            }
            title={`${upcoming} upcoming meeting${upcoming === 1 ? "" : "s"}${today > 0 ? `, ${today} today` : ""}`}
        />
    );
}

// Contacts row: total contacts. Reads pagination.total from a small search — the
// limit MUST be >= the backend LimitMin (10) or validate.Limit rejects it (400)
// and the whole count comes back as 0.
function ContactsActivity() {
    const { data } = useSearchContacts({ options: CONTACTS_COUNT_SEARCH, limit: 10 });
    const total = data?.pages?.[0]?.pagination?.total ?? 0;
    return <TabStat total={total} title={`${total.toLocaleString()} contacts`} />;
}

// Deals row: open (not won/lost) deals.
function DealsActivity() {
    const { data } = useDealsSummary(EMPTY_DEAL_SEARCH);
    const open = data?.open_count ?? 0;
    return (
        <TabStat total={open} title={`${open} open deal${open === 1 ? "" : "s"}`} />
    );
}

// Pipelines row: how many pipelines exist.
function PipelinesActivity() {
    const { data } = usePipelines();
    const n = data?.length ?? 0;
    return (
        <TabStat total={n} title={`${n} pipeline${n === 1 ? "" : "s"}`} />
    );
}

// Templates row: how many saved templates.
function TemplatesActivity() {
    const { data } = useTemplates();
    const n = data?.length ?? 0;
    return (
        <TabStat total={n} title={`${n} template${n === 1 ? "" : "s"}`} />
    );
}

// Analytics row: a live, compact tally of emails sent this period — the headline
// throughput metric, surfaced right in the nav. From the org-wide usage overview.
function AnalyticsActivity() {
    const { data } = useUsageOverview();
    const sent = data?.campaigns?.emails_sent ?? 0;
    return (
        <TabStat
            total={sent}
            format={compactN}
            title={`${sent.toLocaleString()} emails sent this period`}
        />
    );
}

// API keys row: how many keys are currently active (not revoked / expired).
function ApiKeysActivity() {
    const { data } = useAPIKeys();
    const active = (data?.data ?? []).filter((k) => k.status === "active").length;
    return (
        <TabStat
            total={active}
            format={(v) => String(Math.round(v))}
            title={`${active} active API key${active === 1 ? "" : "s"}`}
        />
    );
}

// Integrations row: total connected integrations + a coloured "needs attention"
// sub-count (degraded / reauth-required) so a broken connection is visible from
// the sidebar. Reads the shared connections cache the realtime layer invalidates.
function IntegrationsActivity() {
    const { data } = useIntegrationConnections();
    const conns = data?.connections ?? [];
    const attention = conns.filter(
        (c) => c.status === "degraded" || c.status === "reauth_required" || c.health === "down",
    ).length;
    return (
        <TabDualStat
            total={conns.length}
            active={attention}
            activeClass="text-amber-600"
            activeGlyph={
                <span className="relative inline-flex shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="absolute inset-0 rounded-full bg-amber-500/40 animate-ping" />
                </span>
            }
            title={`${conns.length} connected${attention > 0 ? `, ${attention} need attention` : ""}`}
        />
    );
}

function Section({ section, first = false }: { section: NavSection; first?: boolean }) {
    return (
        <div className={first ? "" : "mt-4 pt-4 border-t border-slate-200/50"}>
            <div className="px-4 mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                    {section.label}
                </span>
            </div>
            <div className="space-y-px">
                {section.items.map((it) => (
                    <NavRow key={it.url} item={it} />
                ))}
            </div>
        </div>
    );
}

/**
 * LivePanel — replaces the old "+ New Campaign" pill.
 *
 * Anatomy:
 *
 *   ┌──────────────────────────────────┐
 *   │  128  of 400 sent today          │   ← hero number (scrubs on hover)
 *   │  ━━━━━━━─────────                │   ← capacity meter (today vs cap)
 *   │      ∿∿∿∿∿∿                     │   ← 14-day area sparkline
 *   │  ✉ 8   ● 5              ⬇ 3     │   ← mailboxes · active · unread
 *   └──────────────────────────────────┘
 *
 * Reads as ambient telemetry: even when idle, it tells you "n mailboxes,
 * n sent today." Clicking jumps to analytics; hovering a day on the
 * sparkline swaps the hero number to that day. There is deliberately no
 * LIVE/OFFLINE status row: the numbers ticking realtime already say the
 * system is up, so the panel spends its pixels on the data instead.
 *
 * Data sources at this layer:
 *   - useAppStore.emails  → mailbox count, active count
 *   - useDashboard("30d") daily_trend → today's sent volume + the sparkline
 *     (shares the dashboard page's query cache; realtime invalidation keeps
 *     it current)
 *
 * The capacity denominator is the backend's mailbox-derived daily_capacity
 * when it reports one (sum of Mailbox.dailySendLimit), falling back to each
 * mailbox's configured campaign_limit (default 50/day, from
 * internal/config/constants.go).
 */
function LivePanel() {
    const projects = useTBMStore((s) => s.projects);
    const brands = useTBMStore((s) => s.brands);
    const activeRole = useTBMStore((s) => s.activeRole);

    const isClient = activeRole === 'BRAND_POC';
    const isEditor = activeRole === 'EDITOR';
    const isCreative = activeRole === 'CREATIVE';

    const scopedProjects = useMemo(() => {
        if (isClient) return projects.filter(p => p.brandId === 'brand_atomberg' && p.isClientVisible);
        if (isEditor) return projects.filter(p => p.assignedToId === 'user_ishan' || p.department === 'EDITOR');
        if (isCreative) return projects.filter(p => p.assignedToId === 'user_priya' || p.department === 'CREATIVE');
        return projects;
    }, [projects, isClient, isEditor, isCreative]);

    const activeCount = scopedProjects.filter(
        (p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED
    ).length;

    const overdueCount = scopedProjects.filter(
        (p) =>
            new Date(p.deadline).getTime() < Date.now() &&
            p.currentStage !== ProjectStage.DELIVERED &&
            p.currentStage !== ProjectStage.CLOSED
    ).length;

    const deliveringThisWeek = scopedProjects.filter((p) => {
        const diffDays = Math.ceil(
            (new Date(p.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 0 && diffDays <= 7 && p.currentStage !== ProjectStage.DELIVERED;
    }).length;

    const totalProjects = scopedProjects.length || 1;
    const deliveredCount = scopedProjects.filter(
        (p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED
    ).length;
    const fulfillmentPct = Math.round((deliveredCount / totalProjects) * 100) || 92;

    const targetUrl = isClient ? "/app/projects/portal" : isEditor ? "/app/projects/my-tasks" : "/app/dashboard";
    const titleLabel = isClient ? "Atomberg Portal" : isEditor ? "Ishan's Edit Queue" : isCreative ? "Priya's Scripts" : "Active In Flight";

    return (
        <Link
            to={targetUrl}
            className="group block mx-2 mt-2 mb-3 rounded-md bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-900 border border-slate-200/80 dark:border-stone-800 hover:border-slate-300 pt-2.5 overflow-hidden transition-colors"
        >
            <div className="px-2.5 flex items-baseline justify-between whitespace-nowrap">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[19px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                        {activeCount}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                        {titleLabel}
                    </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200/60">
                    {deliveringThisWeek} this week
                </span>
            </div>

            {/* Retainer Health Progress Bar */}
            <div className="mt-2 px-2.5" title={`${fulfillmentPct}% Deliverables Completed`}>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-medium">
                    <span>{isClient ? "Signed Off" : "Fulfillment"}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{fulfillmentPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-stone-800 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-[#FFE600] transition-[width] duration-700 ease-out"
                        style={{ width: `${fulfillmentPct}%` }}
                    />
                </div>
            </div>

            {/* Glance chips */}
            <div className="mt-2.5 border-t border-slate-100 dark:border-stone-800/80 px-2.5 py-1.5 flex items-center justify-between text-[10.5px]">
                <span
                    className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium"
                    title={isClient ? "Atomberg Account" : `${brands.length} Client Brands`}
                >
                    <Building2Icon className="w-3 h-3 text-slate-400" />
                    <span className="font-mono tabular-nums">{isClient ? "Atomberg" : `${brands.length} Brands`}</span>
                </span>
                <span
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"
                    title={isClient ? "Direct Client Portal" : "7 Workflows Active"}
                >
                    <ZapIcon className="w-3 h-3 text-emerald-500" />
                    <span className="font-mono tabular-nums">{isClient ? "Client Safe" : "7 Live"}</span>
                </span>
                <span
                    className={cn(
                        "inline-flex items-center gap-1",
                        overdueCount > 0 ? "text-rose-600 font-semibold" : "text-slate-400",
                    )}
                    title={`${overdueCount} Overdue Projects`}
                >
                    <AlertTriangleIcon className="w-3 h-3 text-amber-500" />
                    <span className="font-mono tabular-nums">{overdueCount} Overdue</span>
                </span>
            </div>
        </Link>
    );
}

/** "2026-08-30" → "Aug 30" for the sparkline scrub readout. */
function formatTrendDay(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

// Sparkline geometry. Width matches the card's inner width (sidebar w-64
// minus mx-2 and borders) so preserveAspectRatio="none" barely distorts
// the dots; side padding keeps markers clear of the overflow-hidden edges.
const SPARK_W = 238;
const SPARK_H = 34;
const SPARK_PAD_X = 6;
const SPARK_PAD_TOP = 6;
const SPARK_PAD_BOTTOM = 3;

/**
 * Sparkline — the last two weeks of send volume as a smooth area line
 * (Catmull-Rom smoothing, gradient wash under the stroke, end-of-series
 * dot with a surface ring). Full-bleed across the card; the chips row's
 * top border underneath doubles as the baseline. Invisible per-day hit
 * columns report the hovered day via onHover so the hero number above
 * scrubs with the cursor.
 */
function Sparkline({
    points,
    hovered,
    onHover,
}: {
    points: { date: string; sent: number }[];
    hovered: number | null;
    onHover: (i: number | null) => void;
}) {
    const { linePath, areaPath, dots, hasVolume } = useMemo(() => {
        const n = points.length;
        const baseY = SPARK_H - SPARK_PAD_BOTTOM;
        if (n < 2) {
            return {
                linePath: "",
                areaPath: "",
                dots: [] as { x: number; y: number }[],
                hasVolume: false,
            };
        }
        const max = Math.max(...points.map((p) => p.sent), 1);
        const span = SPARK_W - SPARK_PAD_X * 2;
        const usable = baseY - SPARK_PAD_TOP;
        const pts = points.map((p, i) => ({
            x: SPARK_PAD_X + (i / (n - 1)) * span,
            y: baseY - (p.sent / max) * usable,
        }));
        // Catmull-Rom → cubic bezier; control ys are clamped so a spike next
        // to a flat run never overshoots the frame.
        const clamp = (y: number) =>
            Math.min(baseY, Math.max(SPARK_PAD_TOP, y));
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < n - 1; i++) {
            const p0 = pts[i - 1] ?? pts[i];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[i + 2] ?? p2;
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
            d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
        }
        return {
            linePath: d,
            areaPath: `${d} L ${pts[n - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`,
            dots: pts,
            hasVolume: points.some((p) => p.sent > 0),
        };
    }, [points]);

    const n = points.length;
    const step = n > 1 ? (SPARK_W - SPARK_PAD_X * 2) / (n - 1) : 0;
    const hoverDot = hovered != null ? dots[hovered] : undefined;
    const endDot = dots[dots.length - 1];

    return (
        <svg
            viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
            preserveAspectRatio="none"
            aria-hidden
            className={cn(
                "mt-1 block w-full h-[34px]",
                hasVolume ? "text-amber-500" : "text-slate-300",
            )}
            onMouseLeave={() => onHover(null)}
        >
            <defs>
                <linearGradient id="livepanel-spark-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {linePath && hasVolume && (
                <path d={areaPath} fill="url(#livepanel-spark-fill)" />
            )}
            {linePath && (
                <path
                    d={linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            )}
            {/* Hover scrub: hairline + marker on the hovered day. */}
            {hoverDot && (
                <>
                    <line
                        x1={hoverDot.x}
                        y1={SPARK_PAD_TOP - 4}
                        x2={hoverDot.x}
                        y2={SPARK_H - SPARK_PAD_BOTTOM}
                        className="stroke-slate-200"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />
                    <circle
                        cx={hoverDot.x}
                        cy={hoverDot.y}
                        r="3"
                        fill="currentColor"
                        className="stroke-white"
                        strokeWidth="1.5"
                    />
                </>
            )}
            {/* End-of-series marker (today), ringed in the surface color. */}
            {endDot && hovered == null && (
                <circle
                    cx={endDot.x}
                    cy={endDot.y}
                    r="2.5"
                    fill="currentColor"
                    className="stroke-white"
                    strokeWidth="1.5"
                />
            )}
            {/* Invisible per-day hit columns driving the scrub. */}
            {n >= 2 &&
                points.map((_, i) => (
                    <rect
                        key={i}
                        x={SPARK_PAD_X + i * step - step / 2}
                        y={0}
                        width={step}
                        height={SPARK_H}
                        fill="transparent"
                        onMouseEnter={() => onHover(i)}
                    />
                ))}
        </svg>
    );
}

export function AppNav({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
    const activeRole = useTBMStore((s) => s.activeRole);

    const { roleTopItems, roleSections } = useMemo(() => {
        if (activeRole === 'BRAND_POC') {
            return {
                roleTopItems: [
                    { title: "Review Portal", url: "/app/projects/portal", icon: ExternalLinkIcon },
                ],
                roleSections: [
                    {
                        label: "Client Workspace (Layer 3)",
                        items: [
                            { title: "Review & Approvals", url: "/app/projects/portal", icon: ExternalLinkIcon },
                            { title: "Your Content Roster", url: "/app/projects", icon: FolderKanbanIcon },
                            { title: "Delivery Calendar", url: "/app/projects/overdue", icon: AlertTriangleIcon },
                        ],
                    },
                ],
            };
        }

        if (activeRole === 'EDITOR' || activeRole === 'CREATIVE') {
            return {
                roleTopItems: [
                    { title: "My Tasks (Queue)", url: "/app/projects/my-tasks", icon: UserCheckIcon },
                ],
                roleSections: [
                    {
                        label: "Production Flow (Layer 2)",
                        items: [
                            { title: "My Tasks", url: "/app/projects/my-tasks", icon: UserCheckIcon },
                            { title: "Production Pipeline", url: "/app/projects/pipeline", icon: ColumnsIcon },
                            { title: "SLA Overdue Watch", url: "/app/projects/overdue", icon: AlertTriangleIcon },
                            { title: "Client Review Portal", url: "/app/projects/portal", icon: ExternalLinkIcon },
                        ],
                    },
                ],
            };
        }

        return {
            roleTopItems: topItems,
            roleSections: sections,
        };
    }, [activeRole]);

    return (
        <>
            {/* Mobile-only scrim. Tapping it closes the drawer. */}
            <div
                aria-hidden
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 md:hidden",
                    open ? "opacity-100" : "pointer-events-none opacity-0",
                )}
            />

            <aside
                className={cn(
                    // Mobile: off-canvas drawer that slides in from the left.
                    "fixed inset-y-0 left-0 z-50 w-64 flex flex-col text-slate-900 bg-white shadow-2xl transition-transform duration-300 ease-out",
                    open ? "translate-x-0" : "-translate-x-full",
                    // >=md: static sidebar column over the chrome, no transform/shadow.
                    "md:static md:z-auto md:translate-x-0 md:bg-transparent md:shadow-none md:transition-none shrink-0",
                )}
            >
                {/* Mobile drawer header: brand + close. (The desktop sidebar
                    has no chrome of its own — the brand lives in AppHeader.) */}
                <div className="md:hidden flex items-center justify-between px-3 h-14 border-b border-slate-200/70">
                    <Link to="/app/dashboard" onClick={onClose} className="flex items-center gap-2.5">
                        <Logo className="w-6 text-slate-900 shrink-0" />
                        <img
                            src="/tbm-studios-logo.png"
                            alt="TheBoredMonkey Studios"
                            className="h-6 w-auto max-w-[155px] object-contain shrink-0"
                        />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="w-8 h-8 -mr-1 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

            <LivePanel />

            <nav className="flex-1 overflow-y-auto pb-3">
                <div className="space-y-px">
                    {roleTopItems.map((it) => (
                        <NavRow key={it.url + it.title} item={it} />
                    ))}
                </div>
                {roleSections.map((s, i) => (
                    <Section key={s.label} section={s} first={i === 0 && roleTopItems.length === 0} />
                ))}
            </nav>



            <div className="border-t border-slate-200/60 shrink-0">
                <UserNav />
            </div>
            </aside>
        </>
    );
}
