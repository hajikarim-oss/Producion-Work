import React from 'react';
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  Stat,
  StatStrip,
  TopbarAction,
  EmptyBlock,
} from '@/components/layout/Page';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Project } from '@/lib/tbm/types';
import { ProjectStage, RevisionRound, ClientStatus } from '@/lib/tbm/types';
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  ExternalLink,
  Film,
  Play,
  Sparkles,
  ThumbsUp,
  RotateCcw,
  Check,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectsClientPortalPage() {
  const projects = useTBMStore((s) => s.projects);
  const brands = useTBMStore((s) => s.brands);
  const activeRole = useTBMStore((s) => s.activeRole);
  const updateProject = useTBMStore((s) => s.updateProject);

  const isClientRole = activeRole === 'BRAND_POC';
  const [selectedBrandId, setSelectedBrandId] = React.useState<string>(brands[0]?.id || 'brand_001');

  // Video preview modal state
  const [previewProject, setPreviewProject] = React.useState<Project | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Revision modal state
  const [revisionProject, setRevisionProject] = React.useState<Project | null>(null);
  const [revisionNotes, setRevisionNotes] = React.useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = React.useState(false);

  // Table filtering & pagination
  const [statusTab, setStatusTab] = React.useState<'ALL' | 'AWAITING' | 'PRODUCTION' | 'DELIVERED'>('ALL');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);

  // Active brand
  const activeBrand = brands.find((b) => b.id === selectedBrandId) || brands[0];
  const clientProjects = React.useMemo(() => {
    return projects.filter((p) => p.brandId === activeBrand?.id && p.isClientVisible !== false);
  }, [projects, activeBrand]);

  // Filter groups
  const awaitingFeedbackProjects = React.useMemo(() => {
    return clientProjects.filter(
      (p) =>
        p.clientStatus === ClientStatus.AWAITING_FEEDBACK ||
        p.currentStage === ProjectStage.FIRST_CUT_SENT,
    );
  }, [clientProjects]);

  const deliveredProjects = React.useMemo(() => {
    return clientProjects.filter(
      (p) =>
        p.clientStatus === ClientStatus.DELIVERED ||
        p.clientStatus === ClientStatus.COMPLETE ||
        p.currentStage === ProjectStage.DELIVERED ||
        p.currentStage === ProjectStage.CLOSED,
    );
  }, [clientProjects]);

  const inProductionProjects = React.useMemo(() => {
    return clientProjects.filter(
      (p) =>
        p.clientStatus !== ClientStatus.AWAITING_FEEDBACK &&
        p.currentStage !== ProjectStage.FIRST_CUT_SENT &&
        p.clientStatus !== ClientStatus.DELIVERED &&
        p.clientStatus !== ClientStatus.COMPLETE &&
        p.currentStage !== ProjectStage.DELIVERED &&
        p.currentStage !== ProjectStage.CLOSED,
    );
  }, [clientProjects]);

  // Filtered table roster
  const filteredProjects = React.useMemo(() => {
    return clientProjects.filter((p) => {
      if (statusTab === 'AWAITING') {
        const isAwaiting = p.clientStatus === ClientStatus.AWAITING_FEEDBACK || p.currentStage === ProjectStage.FIRST_CUT_SENT;
        if (!isAwaiting) return false;
      } else if (statusTab === 'PRODUCTION') {
        const isProd =
          p.clientStatus !== ClientStatus.AWAITING_FEEDBACK &&
          p.currentStage !== ProjectStage.FIRST_CUT_SENT &&
          p.clientStatus !== ClientStatus.DELIVERED &&
          p.clientStatus !== ClientStatus.COMPLETE &&
          p.currentStage !== ProjectStage.DELIVERED &&
          p.currentStage !== ProjectStage.CLOSED;
        if (!isProd) return false;
      } else if (statusTab === 'DELIVERED') {
        const isDel =
          p.clientStatus === ClientStatus.DELIVERED ||
          p.clientStatus === ClientStatus.COMPLETE ||
          p.currentStage === ProjectStage.DELIVERED ||
          p.currentStage === ProjectStage.CLOSED;
        if (!isDel) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchType = p.contentType.toLowerCase().includes(q);
        if (!matchTitle && !matchType) return false;
      }
      return true;
    });
  }, [clientProjects, statusTab, search]);

  // Paginated roster
  const paginatedProjects = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [selectedBrandId, statusTab, search, pageSize]);

  // Client Approve
  const handleApproveProject = (project: Project) => {
    updateProject(project.id, {
      currentStage: ProjectStage.FINAL_APPROVED,
      clientStatus: ClientStatus.APPROVED,
      notes: `${project.notes ? project.notes + '\n' : ''}[Approved by Client POC on ${new Date().toLocaleDateString()}]`,
    });
    toast.success(`🎉 Deliverable "${project.title}" approved! Sachin and production notified.`);
  };

  // Client Request Revision
  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionProject) return;

    if (!revisionNotes.trim()) {
      toast.error('Please enter revision feedback notes');
      return;
    }

    const nextRound: RevisionRound =
      revisionProject.revisionRound === RevisionRound.R0
        ? RevisionRound.R1
        : revisionProject.revisionRound === RevisionRound.R1
          ? RevisionRound.R2
          : RevisionRound.R3;

    const nextStage =
      nextRound === RevisionRound.R1
        ? ProjectStage.REVISION_R1
        : nextRound === RevisionRound.R2
          ? ProjectStage.REVISION_R2
          : ProjectStage.REVISION_R3;

    updateProject(revisionProject.id, {
      currentStage: nextStage,
      revisionRound: nextRound,
      clientStatus: ClientStatus.REFINING,
      notes: `${revisionProject.notes ? revisionProject.notes + '\n\n' : ''}[Client Feedback (${nextRound})]: ${revisionNotes.trim()}`,
    });

    toast.success(`Revision request for "${revisionProject.title}" (${nextRound}) routed to editorial team!`);
    setIsRevisionModalOpen(false);
    setRevisionProject(null);
    setRevisionNotes('');
  };

  const completionPct = clientProjects.length > 0 ? Math.round((deliveredProjects.length / clientProjects.length) * 100) : 0;

  return (
    <Page>
      <PageTopbar
        title="Client Review Portal"
        subtitle="Transparent client deliverable review hub with zero internal jargon."
      >
        {!isClientRole && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Brand Portal:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.pocName})
                </option>
              ))}
            </select>
          </div>
        )}
      </PageTopbar>

      <StatStrip cols={4}>
        <Stat
          label="Awaiting Your Review"
          value={awaitingFeedbackProjects.length}
          accent={awaitingFeedbackProjects.length > 0}
          sub="action required"
        />
        <Stat
          label="In Production"
          value={inProductionProjects.length}
          sub="scripting & edits"
        />
        <Stat
          label="Delivered & Mastered"
          value={deliveredProjects.length}
          sub="100% signoff"
        />
        <Stat
          label="Total Content Roster"
          value={clientProjects.length}
          sub={activeBrand?.name || 'Active'}
        />
      </StatStrip>

      <PageBody className="space-y-6">
        {/* Client Welcome Banner with Fulfillment Progress */}
        <Card className="border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/60 via-background to-slate-50/40 dark:from-indigo-950/20 dark:via-background dark:to-slate-900/20">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700">
                  Layer 3 Client Portal
                </Badge>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Client-Safe Isolated View
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {activeBrand?.name} Deliverables Hub
              </h2>
              <p className="text-xs text-muted-foreground max-w-xl">
                Review cuts, leave timecode feedback notes, approve deliverables, and download final masters.
              </p>
              {/* Progress meter */}
              <div className="pt-2 max-w-md space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-700">
                  <span>Retainer Fulfillment: {deliveredProjects.length} of {clientProjects.length} delivered</span>
                  <span className="font-bold">{completionPct}%</span>
                </div>
                <Progress value={completionPct} className="h-1.5 bg-indigo-100" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-background px-4 py-2.5 rounded-lg border border-border shadow-xs text-xs shrink-0">
              <span className="text-muted-foreground">Brand POC:</span>
              <strong className="text-foreground">{activeBrand?.pocName}</strong>
              <span className="text-muted-foreground">({activeBrand?.pocEmail})</span>
            </div>
          </CardContent>
        </Card>

        {/* Priority Section: Awaiting Client Feedback */}
        {awaitingFeedbackProjects.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Action Required: Awaiting Your Feedback ({awaitingFeedbackProjects.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awaitingFeedbackProjects.map((p) => (
                <Card key={p.id} className="border-2 border-emerald-500 shadow-sm flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="default" className="text-[10px] bg-emerald-600 hover:bg-emerald-700">
                          {p.clientStatus}
                        </Badge>
                        <CardTitle className="text-base font-bold mt-2">{p.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 flex items-center gap-2">
                          <span>Format: {p.contentType}</span>
                          <span>&bull;</span>
                          <span>Target: {p.targetDelivery || 'Immediate'}</span>
                        </CardDescription>
                      </div>

                      <Badge variant="outline" className="text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200">
                        {p.revisionRound} Review
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-md bg-muted/50 p-3 border border-border flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-indigo-500" />
                        First Cut Video Review
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          className="text-xs font-semibold gap-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-200"
                          onClick={() => {
                            setPreviewProject(p);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-3 h-3 text-indigo-600" />
                          Watch Cut
                        </Button>
                        <a
                          href={p.reviewUrl || `https://review.theboredmonkey.com/watch/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                        >
                          Player <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {p.notes && (
                      <div className="text-xs bg-muted/30 p-2.5 rounded border border-border text-foreground">
                        <strong className="block mb-0.5 text-muted-foreground font-semibold">Production Notes:</strong>
                        {p.notes}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 border-t border-border flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleApproveProject(p)}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Approve Deliverable
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => {
                        setRevisionProject(p);
                        setIsRevisionModalOpen(true);
                      }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Revision
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section: Your Content (Table view with Filters & Pagination) */}
        <div className="space-y-3">
          <SectionBar
            title="Your Content Roster"
            count={filteredProjects.length}
            description="Client-friendly status tracking. Only transparent milestone labels are displayed."
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200/90 bg-slate-100/70 p-0.5">
                <button
                  onClick={() => setStatusTab('ALL')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    statusTab === 'ALL'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({clientProjects.length})
                </button>
                <button
                  onClick={() => setStatusTab('AWAITING')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    statusTab === 'AWAITING'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Review ({awaitingFeedbackProjects.length})
                </button>
                <button
                  onClick={() => setStatusTab('PRODUCTION')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    statusTab === 'PRODUCTION'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  In Prod ({inProductionProjects.length})
                </button>
                <button
                  onClick={() => setStatusTab('DELIVERED')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                    statusTab === 'DELIVERED'
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Delivered ({deliveredProjects.length})
                </button>
              </div>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search deliverables..."
                className="w-44"
              />
            </div>
          </SectionBar>

          <Card className="p-0 overflow-hidden border-border bg-white shadow-2xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[320px]">Deliverable Title</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Client Status</TableHead>
                  <TableHead>Revision Round</TableHead>
                  <TableHead>Target Delivery</TableHead>
                  <TableHead className="text-right">Review / Master Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No deliverables matching this filter for {activeBrand?.name}.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((p) => {
                    const isAwaiting = p.clientStatus === ClientStatus.AWAITING_FEEDBACK;
                    const isDelivered = p.clientStatus === ClientStatus.DELIVERED || p.clientStatus === ClientStatus.COMPLETE;

                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{p.title}</div>
                          {p.revisionRound === RevisionRound.R3 && (
                            <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                              Priority Polish (R3)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {p.contentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2.5 py-1 rounded text-xs font-medium inline-flex items-center gap-1.5 ${
                              isAwaiting
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 animate-pulse'
                                : isDelivered
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                                  : 'bg-muted text-foreground'
                            }`}
                          >
                            {isDelivered ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {p.clientStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {p.revisionRound === RevisionRound.R0 ? 'R0 (Fresh Cut)' : `${p.revisionRound} Review`}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {p.targetDelivery || p.deadline || 'On Schedule'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs gap-1 text-indigo-600 hover:text-indigo-800"
                              onClick={() => {
                                setPreviewProject(p);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Watch
                            </Button>
                            {isDelivered ? (
                              <a
                                href={`https://drive.theboredmonkey.com/masters/${p.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800 hover:underline text-xs"
                              >
                                Final Master <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1"
                                onClick={() => {
                                  setRevisionProject(p);
                                  setIsRevisionModalOpen(true);
                                }}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Feedback
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <PaginationBar
              currentPage={page}
              totalItems={filteredProjects.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 15, 25, 45]}
            />
          </Card>
        </div>
      </PageBody>

      {/* Revision Request Dialog */}
      <Dialog
        open={isRevisionModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsRevisionModalOpen(false);
            setRevisionProject(null);
            setRevisionNotes('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Changes on Deliverable</DialogTitle>
            <DialogDescription>
              Feedback for <strong className="text-foreground">{revisionProject?.title}</strong> will be logged for{' '}
              <Badge variant="outline" className="font-mono text-xs">
                Round{' '}
                {revisionProject?.revisionRound === RevisionRound.R0
                  ? 'R1'
                  : revisionProject?.revisionRound === RevisionRound.R1
                    ? 'R2'
                    : 'R3'}
              </Badge>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRevision} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Feedback Notes & Specific Timecodes:
              </label>
              <textarea
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. At 0:08, swap the B-roll with the grinder in action. Tighten the hook text overlay."
                className="w-full text-xs p-3 border border-border rounded-md bg-background text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRevisionModalOpen(false);
                  setRevisionProject(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Submit Feedback
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Preview Modal */}
      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPreviewOpen(false);
            setPreviewProject(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-slate-950 text-white border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-indigo-500 text-indigo-400 bg-indigo-950/40 text-[10px]">
                {previewProject?.contentType || 'REEL'}
              </Badge>
              <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-950/40 text-[10px]">
                {previewProject?.revisionRound || 'R0'}
              </Badge>
            </div>
            <DialogTitle className="text-base font-bold text-white mt-1">
              {previewProject?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Brand: {previewProject?.brandName} • Status: {previewProject?.clientStatus}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {/* Mock Video Canvas */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <div className="h-16 w-16 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer border border-white/20 shadow-lg group">
                <Play className="w-7 h-7 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-4 text-xs font-semibold text-slate-200">
                TBM Production Cut Preview
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                1080x1920 9:16 Vertical Master • 00:45s • High-Bitrate H.264
              </div>

              {/* Player scrub bar mockup */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                <span>00:14</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden relative">
                  <div className="h-full w-1/3 bg-indigo-500 rounded-full" />
                </div>
                <span>00:45</span>
              </div>
            </div>

            {previewProject?.reviewUrl && (
              <div className="mt-3 flex items-center justify-between p-2.5 rounded bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Frame.io / Raw cut asset link:</span>
                <a
                  href={previewProject.reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
                >
                  Open in Frame.io <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-900"
              onClick={() => {
                setIsPreviewOpen(false);
                setPreviewProject(null);
              }}
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-600 text-amber-400 hover:bg-amber-950/40 gap-1.5"
                onClick={() => {
                  const target = previewProject;
                  setIsPreviewOpen(false);
                  setPreviewProject(null);
                  if (target) {
                    setRevisionProject(target);
                    setIsRevisionModalOpen(true);
                  }
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Request Changes
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
                onClick={() => {
                  if (previewProject) {
                    handleApproveProject(previewProject);
                    setIsPreviewOpen(false);
                    setPreviewProject(null);
                  }
                }}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Approve Deliverable
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
