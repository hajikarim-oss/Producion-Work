import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  Stat,
  StatStrip,
  TopbarAction,
} from "@/components/layout/Page";
import { useTBMStore } from "@/lib/tbm/tbmStore";
import type { Project, Brand, TeamMember } from "@/lib/tbm/types";
import { ProjectStage, RevisionRound, ContentType, ClientStatus } from "@/lib/tbm/types";
import { ProjectEditModal } from "@/components/tbm/ProjectEditModal";
import { CreateProjectDialog } from "@/components/tbm/CreateProjectDialog";
import { PaginationBar } from "@/components/tbm/PaginationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Columns,
  ExternalLink,
  Film,
  Flame,
  FolderKanban,
  Gauge,
  HelpCircle,
  Layers,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

type DelayFilter = "ALL" | "EDITOR" | "BRAND" | "OVERDUE";
type TeamCapacityFilter = "ALL" | "OVERLOADED" | "BUSY" | "AVAILABLE";

export default function MasterDashboardPage() {
  const navigate = useNavigate();
  const projects = useTBMStore((s) => s.projects);
  const brands = useTBMStore((s) => s.brands);
  const members = useTBMStore((s) => s.members);
  const activeRole = useTBMStore((s) => s.activeRole);
  const triggerScheduledWorkflows = useTBMStore((s) => s.triggerScheduledWorkflows);

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Filter & Pagination States
  const [delayFilter, setDelayFilter] = React.useState<DelayFilter>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [delayPage, setDelayPage] = React.useState(1);
  const [delayPageSize, setDelayPageSize] = React.useState(8);

  const [teamFilter, setTeamFilter] = React.useState<TeamCapacityFilter>("ALL");

  // Master KPIs strictly computed
  const activeProjects = React.useMemo(
    () => projects.filter((p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED),
    [projects]
  );

  const completedProjects = React.useMemo(
    () => projects.filter((p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED),
    [projects]
  );

  const editorDelayProjects = React.useMemo(
    () => activeProjects.filter((p) => p.internalNotes && p.internalNotes.includes("EDITOR DELAY")),
    [activeProjects]
  );

  const brandDelayProjects = React.useMemo(
    () => activeProjects.filter((p) => p.internalNotes && (p.internalNotes.includes("BRAND SLOW") || p.internalNotes.includes("BRAND DELAY"))),
    [activeProjects]
  );

  const overdueProjects = React.useMemo(
    () => activeProjects.filter(
      (p) => (p.internalNotes && p.internalNotes.includes("OVERDUE")) || (p.overallStatus === "⚠️ OVERDUE" && !p.internalNotes?.includes("EDITOR DELAY") && !p.internalNotes?.includes("BRAND SLOW"))
    ),
    [activeProjects]
  );

  const onTrackProjects = React.useMemo(
    () => activeProjects.filter(
      (p) => p.overallStatus === "✅ On Track" && !p.internalNotes?.includes("EDITOR DELAY") && !p.internalNotes?.includes("BRAND SLOW") && !p.internalNotes?.includes("OVERDUE")
    ),
    [activeProjects]
  );

  const allDelayProjects = React.useMemo(() => {
    return activeProjects.filter((p) => {
      const notes = p.internalNotes || "";
      return notes.includes("EDITOR DELAY") || notes.includes("BRAND SLOW") || notes.includes("OVERDUE") || p.overallStatus === "⚠️ OVERDUE";
    });
  }, [activeProjects]);

  // Filtered delay projects
  const filteredDelayProjects = React.useMemo(() => {
    return allDelayProjects.filter((p) => {
      const notes = p.internalNotes || "";
      if (delayFilter === "EDITOR" && !notes.includes("EDITOR DELAY")) return false;
      if (delayFilter === "BRAND" && !notes.includes("BRAND SLOW")) return false;
      if (delayFilter === "OVERDUE" && (!notes.includes("OVERDUE") && p.overallStatus !== "⚠️ OVERDUE")) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesBrand = p.brandName.toLowerCase().includes(q);
        const matchesEditor = p.assigneeName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesEditor) return false;
      }
      return true;
    });
  }, [allDelayProjects, delayFilter, searchQuery]);

  // Paginated slice
  const paginatedDelays = React.useMemo(() => {
    const start = (delayPage - 1) * delayPageSize;
    return filteredDelayProjects.slice(start, start + delayPageSize);
  }, [filteredDelayProjects, delayPage, delayPageSize]);

  // Reset page when filter changes
  React.useEffect(() => {
    setDelayPage(1);
  }, [delayFilter, searchQuery, delayPageSize]);

  // Cron workflow trigger
  const handleRunAudits = () => {
    const res = triggerScheduledWorkflows();
    toast.success(
      `Master Audit Executed! 8 AM scan: ${res.deadlineCount} deadline warnings • 9 AM scan: ${res.staleCount} stale tasks flagged.`
    );
  };

  const handleCreateQuickProject = () => {
    if (activeRole !== "ADMIN") {
      toast.error("Only Sachin (Master Admin) can initialize new deliverables");
      return;
    }
    setIsCreateOpen(true);
  };

  // Immediate attention alerts from CSV rows 77-81
  const immediateAlerts = [
    { title: "Job Hopping", brand: "Big Leap", editor: "Chinmay", date: "17 Jul", reason: "⚡ EDITOR LATE: 34 days behind on Internal Revision R2" },
    { title: "companies hire on skills", brand: "Big Leap", editor: "Ayush Shukla", date: "17 Jul", reason: "⚡ EDITOR LATE: 34 days behind on External Revision R2" },
    { title: "Shivani", brand: "Phone Pe", editor: "Shubham", date: "15 Jul", reason: "⚡ EDITOR LATE: 39 days overdue, Not Started" },
    { title: "Founder team Photos", brand: "TBM", editor: "Chetan", date: "3 Jul", reason: "⚡ EDITOR LATE: 46 days overdue in progress" },
  ];

  // Team capacity analytics
  const teamAnalytics = React.useMemo(() => {
    const overloaded = members.filter((m) => {
      const count = projects.filter((p) => p.assignedToId === m.id && p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length;
      return count >= 7;
    });
    const busy = members.filter((m) => {
      const count = projects.filter((p) => p.assignedToId === m.id && p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length;
      return count > 0 && count < 7;
    });
    const available = members.filter((m) => {
      const count = projects.filter((p) => p.assignedToId === m.id && p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length;
      return count === 0;
    });
    return { overloaded, busy, available };
  }, [members, projects]);

  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const mActive = projects.filter((p) => p.assignedToId === m.id && p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length;
      if (teamFilter === "OVERLOADED") return mActive >= 7;
      if (teamFilter === "BUSY") return mActive > 0 && mActive < 7;
      if (teamFilter === "AVAILABLE") return mActive === 0;
      return true;
    });
  }, [members, projects, teamFilter]);

  const totalProjectsCount = projects.length || 1;
  const portfolioHealthScore = Math.round(
    ((onTrackProjects.length + completedProjects.length) / totalProjectsCount) * 100
  );

  const funnelMetrics = React.useMemo(() => {
    const total = projects.length || 1;
    const preProd = projects.filter((p) =>
      [
        ProjectStage.BRIEF_RECEIVED,
        ProjectStage.BRIEF_CALL_DONE,
        ProjectStage.CONCEPT_IN_PROGRESS,
        ProjectStage.CONCEPT_SENT,
        ProjectStage.CONCEPT_APPROVED,
        ProjectStage.SCRIPT_IN_PROGRESS,
        ProjectStage.SCRIPT_APPROVED,
        ProjectStage.PRE_PRODUCTION,
      ].includes(p.currentStage)
    ).length;

    const prodEdit = projects.filter((p) =>
      [
        ProjectStage.SHOOT_SCHEDULED,
        ProjectStage.SHOOT_DONE,
        ProjectStage.RAW_RECEIVED,
        ProjectStage.EDIT_IN_PROGRESS,
        ProjectStage.FIRST_CUT_READY,
      ].includes(p.currentStage)
    ).length;

    const reviewRev = projects.filter((p) =>
      [
        ProjectStage.FIRST_CUT_SENT,
        ProjectStage.CLIENT_FEEDBACK,
        ProjectStage.REVISION_R1,
        ProjectStage.REVISION_R2,
        ProjectStage.REVISION_R3,
      ].includes(p.currentStage)
    ).length;

    const deliveredClosed = projects.filter((p) =>
      [
        ProjectStage.FINAL_APPROVED,
        ProjectStage.DELIVERED,
        ProjectStage.INVOICED,
        ProjectStage.CLOSED,
      ].includes(p.currentStage)
    ).length;

    return {
      preProd,
      prodEdit,
      reviewRev,
      deliveredClosed,
      preProdPct: Math.round((preProd / total) * 100),
      prodEditPct: Math.round((prodEdit / total) * 100),
      reviewRevPct: Math.round((reviewRev / total) * 100),
      deliveredClosedPct: Math.round((deliveredClosed / total) * 100),
    };
  }, [projects]);

  return (
    <Page>
      {/* Edge-to-edge Topbar with no line wrapping and clean alignment */}
      <PageTopbar
        eyebrow="Layer 1: Master Overview • Sachin Admin"
        title="Project Management Dashboard"
        subtitle="Real-time production throughput, SLA bottlenecks & scheduled deliveries"
      >
        <TopbarAction
          icon={<Plus className="w-3.5 h-3.5 text-slate-900" />}
          label="New Deliverable"
          onClick={handleCreateQuickProject}
        />
        <TopbarAction
          icon={<ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
          label="Run 8AM/9AM Audit"
          onClick={handleRunAudits}
        />
        <TopbarAction
          icon={<Columns className="w-3.5 h-3.5 text-slate-700" />}
          label="Kanban Pipeline"
          onClick={() => navigate("/app/projects/pipeline")}
        />
      </PageTopbar>

      {/* Master KPI StatStrip — 5 Columns representing the 5 Google Sheet blocks */}
      <StatStrip cols={5}>
        <Stat
          label="Active Projects"
          value={activeProjects.length}
          sub={`${brands.filter((b) => b.status === "ACTIVE").length} client brands`}
        />
        <Stat
          label="On Track"
          value={onTrackProjects.length}
          sub="green SLA health"
        />
        <Stat
          label="Editor Delays"
          value={editorDelayProjects.length}
          sub="⚡ 32 bottlenecks"
          accent={editorDelayProjects.length > 0}
        />
        <Stat
          label="Brand Delays"
          value={brandDelayProjects.length}
          sub="⏳ 4 awaiting POC"
          accent={brandDelayProjects.length > 0}
        />
        <Stat
          label="Critical Overdue"
          value={overdueProjects.length}
          sub="🚨 9 SLA breaches"
          accent={overdueProjects.length > 0}
          last={true}
        />
      </StatStrip>

      <PageBody className="p-5 space-y-6">
        {/* 📊 Executive Portfolio Pulse */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Agency SLA Health Score
              </div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{portfolioHealthScore}% Delivery Velocity</span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {onTrackProjects.length + completedProjects.length} on schedule
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 flex-wrap">
            <div>
              <span className="text-slate-400 block text-[10.5px]">Fulfillment</span>
              <strong className="text-slate-900 font-bold">{completedProjects.length} / {projects.length}</strong> ({Math.round((completedProjects.length / totalProjectsCount) * 100)}%)
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-slate-400 block text-[10.5px]">In-Flight Bottlenecks</span>
              <strong className="text-amber-700 font-bold">{allDelayProjects.length}</strong> of {activeProjects.length} active
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-slate-400 block text-[10.5px]">Active Editors</span>
              <strong className="text-slate-900 font-bold">{members.length - teamAnalytics.available.length}</strong> of {members.length} roster
            </div>
          </div>
        </div>

        {/* 💡 High-Value Executive Intelligence Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Workload Concentration Risk */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Editor Workload Imbalance
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-bold">
                  {teamAnalytics.overloaded.length} Overloaded
                </Badge>
              </div>
              <p className="text-[11.5px] text-amber-800 leading-snug">
                <strong>Ishan (7)</strong>, <strong>Shubham (17)</strong>, and <strong>Chetan (10)</strong> hold 85% of all active deliverables, while <strong>5 creatives</strong> are completely available.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between">
              <span className="text-[10.5px] text-amber-700 font-mono">5 Creatives Free Now</span>
              <button
                onClick={() => setTeamFilter("OVERLOADED")}
                className="text-[11px] font-bold text-amber-900 hover:text-black underline cursor-pointer"
              >
                Rebalance Roster →
              </button>
            </div>
          </div>

          {/* Card 2: Client Review Stagnation */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Client Feedback Lag
                </span>
                <Badge variant="outline" className="text-[10px] bg-indigo-100 text-indigo-900 border-indigo-300 font-bold">
                  4 Stalled
                </Badge>
              </div>
              <p className="text-[11.5px] text-indigo-800 leading-snug">
                Phone Pe (3) and BSS (1) deliverables have had First Cuts delivered with feedback pending for over <strong>41 days average</strong>.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-indigo-200/80 flex items-center justify-between">
              <span className="text-[10.5px] text-indigo-700 font-mono">SLA Hold Applied</span>
              <button
                onClick={() => {
                  setDelayFilter("BRAND");
                  toast.success("Filtered to 4 stalled brand reviews. Nudge emails ready.");
                }}
                className="text-[11px] font-bold text-indigo-900 hover:text-black underline cursor-pointer"
              >
                Nudge Brand POCs →
              </button>
            </div>
          </div>

          {/* Card 3: Production Throughput & Velocity */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Total Delivery Velocity
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-900 border-emerald-300 font-bold">
                  {completedProjects.length} Delivered
                </Badge>
              </div>
              <p className="text-[11.5px] text-emerald-800 leading-snug">
                <strong>29 deliverables</strong> fully approved and closed (Everstage 100%, Phone Pe 52%, Big Leap 41%). <strong>35 deliverables</strong> currently on track for sign-off.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center justify-between">
              <span className="text-[10.5px] text-emerald-700 font-mono">109 Total Portfolio</span>
              <button
                onClick={() => navigate("/app/projects")}
                className="text-[11px] font-bold text-emerald-900 hover:text-black underline cursor-pointer"
              >
                View Master Ledger →
              </button>
            </div>
          </div>
        </div>

        {/* 🚨 Immediate Attention Required Alert Card */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-2">
                  Immediate Attention Required
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-bold">
                    4 Escalations
                  </Badge>
                </h4>
                <p className="text-[11.5px] text-rose-800 mt-0.5">
                  Critical editor delays & deadline breaches flagged on the 8:00 AM master tracker audit.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => navigate("/app/projects/overdue")}
              className="text-xs shrink-0 font-medium"
            >
              Inspect All Bottlenecks <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
            {immediateAlerts.map((alt, i) => (
              <div
                key={i}
                className="bg-white/90 rounded-lg p-2.5 border border-rose-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <Badge variant="outline" className="text-[9.5px] font-mono px-1.5 py-0 border-rose-300 bg-rose-50 text-rose-800">
                      ⚡ EDITOR LATE
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">DL {alt.date}</span>
                  </div>
                  <h5 className="text-[12.5px] font-semibold text-slate-900 truncate">
                    {alt.title}
                  </h5>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-medium text-slate-800">{alt.brand}</span> • {alt.editor}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-rose-700 font-medium truncate">
                    {alt.reason.split(":")[1]?.trim() || "Immediate action"}
                  </span>
                  <button
                    onClick={() => {
                      const p = projects.find((x) => x.title.toLowerCase().includes(alt.title.toLowerCase()));
                      if (p) {
                        setSelectedProject(p);
                        setIsModalOpen(true);
                      } else {
                        navigate("/app/projects");
                      }
                    }}
                    className="text-[11px] font-bold text-slate-900 hover:text-black underline cursor-pointer shrink-0 ml-1"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 1: DELAY TRACKER — Editor Delays vs Brand Delays (With Pagination & Controls) */}
        <div className="space-y-3">
          <SectionBar
            title="Delay Tracker — Bottlenecks & Overdue Deliverables"
            count={allDelayProjects.length}
            description="Real-time breakdown of 32 editor bottlenecks, 4 client review delays, and 9 SLA deadline breaches."
          >
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab Pills */}
              <div className="inline-flex rounded-lg border border-slate-200/90 bg-slate-100/70 p-0.5">
                <button
                  onClick={() => setDelayFilter("ALL")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    delayFilter === "ALL"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({allDelayProjects.length})
                </button>
                <button
                  onClick={() => setDelayFilter("EDITOR")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    delayFilter === "EDITOR"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚡ Editor ({editorDelayProjects.length})
                </button>
                <button
                  onClick={() => setDelayFilter("BRAND")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    delayFilter === "BRAND"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⏳ Brand ({brandDelayProjects.length})
                </button>
                <button
                  onClick={() => setDelayFilter("OVERDUE")}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    delayFilter === "OVERDUE"
                      ? "bg-white text-slate-900 font-semibold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🔴 Overdue ({overdueProjects.length})
                </button>
              </div>

              {/* Search Bar */}
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search delays or editor…"
                className="w-48"
              />
            </div>
          </SectionBar>

          <Card className="p-0 overflow-hidden border-border bg-white shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/70">
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] w-[260px]">
                    Project Title
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    Brand
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    Assigned Editor
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    Internal DL
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    External DL
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    ⚡ Who's Late
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                    Current Status
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDelays.map((p) => {
                  const notes = p.internalNotes || "";
                  const isEditorDelay = notes.includes("EDITOR DELAY");
                  const isBrandSlow = notes.includes("BRAND SLOW");
                  const isOverdue = notes.includes("OVERDUE") || p.overallStatus === "⚠️ OVERDUE";

                  return (
                    <TableRow key={p.id} className="h-11 hover:bg-slate-50/80 transition-colors border-b border-slate-200/60">
                      <TableCell className="px-3 py-2 text-[12.5px] font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              setSelectedProject(p);
                              setIsModalOpen(true);
                            }}
                            className="hover:underline cursor-pointer font-semibold text-slate-950 truncate max-w-[240px]"
                            title={p.title}
                          >
                            {p.title}
                          </span>
                          {p.revisionRound === RevisionRound.R2 && (
                            <Badge variant="outline" className="text-[9.5px] h-4 px-1 font-mono bg-amber-50 text-amber-800 border-amber-300">
                              R2
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[12.5px]">
                        <Badge variant="secondary" className="font-medium text-slate-800 bg-slate-100 border border-slate-200/60 text-[11px]">
                          {p.brandName}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[12.5px] text-slate-800 font-medium">
                        {p.assigneeName || "Unassigned"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[11.5px] text-slate-600 font-mono">
                        {p.deadline || "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[11.5px] text-slate-600 font-mono">
                        {p.targetDelivery || "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[12.5px]">
                        {isEditorDelay && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            ⚡ Editor Delay
                          </span>
                        )}
                        {isBrandSlow && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                            ⏳ Brand Slow
                          </span>
                        )}
                        {!isEditorDelay && !isBrandSlow && isOverdue && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            🔴 Overdue
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[12px] text-slate-700">
                        {p.clientStatus}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-xs font-semibold text-slate-700 hover:text-black hover:bg-slate-100"
                          onClick={() => {
                            setSelectedProject(p);
                            setIsModalOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Clean Pagination Bar */}
            <PaginationBar
              currentPage={delayPage}
              totalItems={filteredDelayProjects.length}
              pageSize={delayPageSize}
              onPageChange={setDelayPage}
              onPageSizeChange={setDelayPageSize}
              pageSizeOptions={[8, 15, 25, 45]}
            />
          </Card>
        </div>

        {/* Section 2: Two-Column Responsive Split — TEAM CAPACITY & BRAND HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: 👥 TEAM STATUS — Who's busy, who's free, and who's behind */}
          <Card className="border-border bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-600" />
                    Team Capacity & Bandwidth
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Editor workloads, real-time bandwidth & delivery bottlenecks
                  </CardDescription>
                </div>
                {/* Capacity Filter Pills */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
                  <button
                    onClick={() => setTeamFilter("ALL")}
                    className={`px-2 py-0.5 text-[10.5px] font-medium rounded transition-colors cursor-pointer ${
                      teamFilter === "ALL" ? "bg-white text-slate-900 font-semibold shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    All ({members.length})
                  </button>
                  <button
                    onClick={() => setTeamFilter("OVERLOADED")}
                    className={`px-2 py-0.5 text-[10.5px] font-medium rounded transition-colors cursor-pointer ${
                      teamFilter === "OVERLOADED" ? "bg-white text-rose-800 font-semibold shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    🔴 ({teamAnalytics.overloaded.length})
                  </button>
                  <button
                    onClick={() => setTeamFilter("AVAILABLE")}
                    className={`px-2 py-0.5 text-[10.5px] font-medium rounded transition-colors cursor-pointer ${
                      teamFilter === "AVAILABLE" ? "bg-white text-emerald-800 font-semibold shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    🟢 ({teamAnalytics.available.length})
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70">
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Name</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Dept</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Capacity</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Active / Late</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Free From</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((m) => {
                      const mProjects = projects.filter((p) => p.assignedToId === m.id);
                      const mActive = mProjects.filter(
                        (p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED
                      ).length;
                      const mLate = mProjects.filter(
                        (p) => p.internalNotes && (p.internalNotes.includes("DELAY") || p.internalNotes.includes("OVERDUE"))
                      ).length;

                      let capacityPill = "🟢 Available";
                      let capColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                      if (mActive >= 7) {
                        capacityPill = "🔴 Overloaded";
                        capColor = "text-rose-700 bg-rose-50 border-rose-200";
                      } else if (mActive > 0) {
                        capacityPill = "🔴 Busy";
                        capColor = "text-amber-700 bg-amber-50 border-amber-200";
                      }

                      return (
                        <TableRow key={m.id} className="h-10 hover:bg-slate-50/70 border-b border-slate-200/50">
                          <TableCell className="px-3 py-2 text-[12.5px] font-semibold text-slate-900">
                            {m.name}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11.5px] text-slate-600">
                            {m.department}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11px]">
                            <span className={`inline-block px-1.5 py-0.5 rounded border font-medium ${capColor}`}>
                              {capacityPill}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[12px] font-mono text-slate-800">
                            <span className="font-bold">{mActive}</span>
                            {mLate > 0 && <span className="text-rose-600 font-semibold ml-1">({mLate} late)</span>}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11.5px] text-slate-600">
                            {mActive === 0 ? "✅ Now" : "After 16 Jul"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: 🏷️ BRAND HEALTH — Project Progress + Delays Per Brand */}
          <Card className="border-border bg-white shadow-2xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-600" />
                    Brand Health & Retainers
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Deliverable throughput, stuck pipeline stages & active editors
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => navigate("/app/projects/brands")}
                >
                  All Brands
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/70">
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Brand</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Progress</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Stuck Stage</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Delays</TableHead>
                      <TableHead className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em]">Assigned Team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.filter((b) => b.id !== "brand_007").map((b) => {
                      const bProjects = projects.filter((p) => p.brandId === b.id);
                      const total = bProjects.length;
                      const done = bProjects.filter(
                        (p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED
                      ).length;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

                      // Stuck stage display
                      let stuckStage = "—";
                      if (b.name === "BSS") stuckStage = "📅 Shoot Scheduled";
                      else if (b.name === "Big Leap") stuckStage = "👀 In Review";
                      else if (b.name === "Phone Pe") stuckStage = "📹 Footage Ready";
                      else if (b.name === "TBM") stuckStage = "✂️ Editing";
                      else if (b.name === "Unseen Men") stuckStage = "⏳ Awaiting Brief";
                      else if (b.name === "Everstage") stuckStage = "✅ Retainer Complete";

                      // Delays count
                      const editorLate = bProjects.filter((p) => p.internalNotes?.includes("EDITOR DELAY")).length;
                      const brandSlow = bProjects.filter((p) => p.internalNotes?.includes("BRAND SLOW")).length;

                      // Assigned team members
                      const editorsOnIt = Array.from(new Set(bProjects.map((p) => p.assigneeName).filter(Boolean)));
                      const displayEditors = editorsOnIt.length > 2
                        ? `${editorsOnIt.slice(0, 2).join(", ")} +${editorsOnIt.length - 2}`
                        : editorsOnIt.join(", ") || "—";

                      return (
                        <TableRow key={b.id} className="h-11 hover:bg-slate-50/70 border-b border-slate-200/50">
                          <TableCell className="px-3 py-2 text-[12.5px] font-semibold text-slate-900">
                            <div>
                              <span>{b.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">{b.tier}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11.5px] w-28">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-semibold text-slate-700">
                                <span>{pct}%</span>
                                <span>{done}/{total}</span>
                              </div>
                              <Progress value={pct} className="h-1.5 bg-slate-100" />
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11.5px] text-slate-700 font-medium">
                            {stuckStage}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11px] font-mono">
                            {editorLate > 0 && (
                              <span className="text-amber-700 font-bold block">⚡ {editorLate} editor late</span>
                            )}
                            {brandSlow > 0 && (
                              <span className="text-indigo-700 font-bold block">⏳ {brandSlow} brand slow</span>
                            )}
                            {editorLate === 0 && brandSlow === 0 && (
                              <span className="text-emerald-700">✅ No delays</span>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-[11px] text-slate-600 truncate max-w-[130px]" title={editorsOnIt.join(", ")}>
                            {displayEditors}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: 22-Stage Pipeline Distribution */}
        <Card className="border-border bg-white shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  22-Stage Pipeline Distribution Funnel
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Aggregate distribution across creative, production, client review & delivered states
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => navigate("/app/projects/pipeline")}
              >
                Kanban Pipeline <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Pre-Production */}
            <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>1. Pre-Production</span>
                <span className="font-bold text-slate-950">
                  {funnelMetrics.preProd}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">({funnelMetrics.preProdPct}%)</span>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mb-2">Brief, Script & Storyboarding</p>
              <Progress value={funnelMetrics.preProdPct} className="h-1.5 bg-stone-200/60" />
            </div>

            {/* Production & Assembly */}
            <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>2. Production & Edit</span>
                <span className="font-bold text-slate-950">
                  {funnelMetrics.prodEdit}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">({funnelMetrics.prodEditPct}%)</span>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mb-2">Shoot, Raw & Assembly Edits</p>
              <Progress value={funnelMetrics.prodEditPct} className="h-1.5 bg-stone-200/60" />
            </div>

            {/* Review & Revisions */}
            <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>3. Review & Revisions</span>
                <span className="font-bold text-slate-950">
                  {funnelMetrics.reviewRev}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">({funnelMetrics.reviewRevPct}%)</span>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mb-2">Feedback & Rounds R1, R2, R3</p>
              <Progress value={funnelMetrics.reviewRevPct} className="h-1.5 bg-stone-200/60" />
            </div>

            {/* Delivered */}
            <div className="p-3 bg-stone-50/70 rounded-lg border border-stone-200/80">
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>4. Sign-off & Closed</span>
                <span className="font-bold text-slate-950">
                  {funnelMetrics.deliveredClosed}{' '}
                  <span className="text-[10px] text-slate-500 font-normal">({funnelMetrics.deliveredClosedPct}%)</span>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 mb-2">100% Client Sign-off</p>
              <Progress value={funnelMetrics.deliveredClosedPct} className="h-1.5 bg-emerald-100" />
            </div>
          </CardContent>
        </Card>
      </PageBody>

      {/* Edit Deliverable Modal */}
      {selectedProject && (
        <ProjectEditModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}

      {/* Quick Add Deliverable Dialog */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Page>
  );
}
