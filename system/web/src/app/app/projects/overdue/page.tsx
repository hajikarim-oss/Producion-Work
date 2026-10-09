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
import { ProjectStage, RevisionRound } from '@/lib/tbm/types';
import { ProjectEditModal } from '@/components/tbm/ProjectEditModal';
import { ExtendSLADialog } from '@/components/tbm/ExtendSLADialog';
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

type DelayCategory = 'ALL' | 'CRITICAL' | 'EDITOR' | 'BRAND';

export default function ProjectsOverduePage() {
  const projects = useTBMStore((s) => s.projects);
  const activeRole = useTBMStore((s) => s.activeRole);
  const updateProject = useTBMStore((s) => s.updateProject);
  const escalateProject = useTBMStore((s) => s.escalateProject);
  const triggerScheduledWorkflows = useTBMStore((s) => s.triggerScheduledWorkflows);

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const [extendingProject, setExtendingProject] = React.useState<Project | null>(null);
  const [isExtendOpen, setIsExtendOpen] = React.useState(false);

  const [filterCategory, setFilterCategory] = React.useState<DelayCategory>('ALL');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(8);

  const now = new Date();

  // All active bottlenecks (45 items from real dataset)
  const allBottlenecks = React.useMemo(() => {
    return projects.filter((p) => {
      if (p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED) return false;
      const notes = p.internalNotes || '';
      return notes.includes('DELAY') || notes.includes('OVERDUE') || notes.includes('BRAND SLOW') || p.overallStatus === '⚠️ OVERDUE';
    });
  }, [projects]);

  const editorDelays = React.useMemo(
    () => allBottlenecks.filter((p) => p.internalNotes?.includes('EDITOR DELAY')),
    [allBottlenecks]
  );

  const brandDelays = React.useMemo(
    () => allBottlenecks.filter((p) => p.internalNotes?.includes('BRAND SLOW')),
    [allBottlenecks]
  );

  const criticalDelays = React.useMemo(
    () => allBottlenecks.filter((p) => (p.internalNotes?.includes('OVERDUE') || p.overallStatus === '⚠️ OVERDUE') && !p.internalNotes?.includes('EDITOR DELAY') && !p.internalNotes?.includes('BRAND SLOW')),
    [allBottlenecks]
  );

  const filteredBottlenecks = React.useMemo(() => {
    return allBottlenecks.filter((p) => {
      const notes = p.internalNotes || '';
      if (filterCategory === 'CRITICAL' && !criticalDelays.includes(p)) return false;
      if (filterCategory === 'EDITOR' && !notes.includes('EDITOR DELAY')) return false;
      if (filterCategory === 'BRAND' && !notes.includes('BRAND SLOW')) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesBrand = p.brandName.toLowerCase().includes(q);
        const matchesEditor = p.assigneeName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesEditor) return false;
      }
      return true;
    });
  }, [allBottlenecks, filterCategory, search, criticalDelays]);

  // Paginated slice
  const paginatedDelays = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBottlenecks.slice(start, start + pageSize);
  }, [filteredBottlenecks, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [filterCategory, search, pageSize]);

  const handleExtendSLA = (p: Project) => {
    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can grant SLA extensions');
      return;
    }
    setExtendingProject(p);
    setIsExtendOpen(true);
  };

  const handleEscalateToSachin = (p: Project) => {
    escalateProject(p.id, 'Turnaround SLA breach escalated from Watchtower');
    toast.success(`⚡ Escalated "${p.title}" to Sachin's Priority Queue & Slack alert sent!`);
  };

  return (
    <Page>
      <PageTopbar
        title="SLA & Overdue Watchtower"
        eyebrow="Turnaround Governance • Workflow Alerts"
        subtitle="Active bottlenecks exceeding turnaround benchmarks • Automated 8 AM and 9 AM reminders"
      >
        <TopbarAction
          variant="ghost"
          icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
          label="Scan & Run Audits"
          onClick={() => {
            const res = triggerScheduledWorkflows();
            toast.success(`Audit complete: ${res.deadlineCount} deadline alerts flagged`);
          }}
        />
      </PageTopbar>

      <StatStrip cols={4}>
        <Stat
          label="Total Bottlenecks"
          value={allBottlenecks.length}
          accent={allBottlenecks.length > 0}
          sub="flagged on master tracker"
        />
        <Stat
          label="Critical SLA Breaches"
          value={criticalDelays.length}
          accent={criticalDelays.length > 0}
          sub="immediate attention"
        />
        <Stat
          label="Editor Workload Delays"
          value={editorDelays.length}
          sub="production bottlenecks"
        />
        <Stat
          label="Brand Feedback Lag"
          value={brandDelays.length}
          sub="awaiting client POC approval"
          last={true}
        />
      </StatStrip>

      <PageBody className="p-5 space-y-4">
        {/* Controls & Search */}
        <SectionBar
          title="Active Turnaround Bottlenecks"
          count={filteredBottlenecks.length}
          description="Detailed breakdown of internal editor delays, client review lag, and overdue deliverables."
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({allBottlenecks.length})
              </button>
              <button
                onClick={() => setFilterCategory('CRITICAL')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterCategory === 'CRITICAL'
                    ? 'bg-white text-rose-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔴 Critical ({criticalDelays.length})
              </button>
              <button
                onClick={() => setFilterCategory('EDITOR')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterCategory === 'EDITOR'
                    ? 'bg-white text-amber-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Editor ({editorDelays.length})
              </button>
              <button
                onClick={() => setFilterCategory('BRAND')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterCategory === 'BRAND'
                    ? 'bg-white text-indigo-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⏳ Brand ({brandDelays.length})
              </button>
            </div>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search bottlenecks…"
              className="w-48"
            />
          </div>
        </SectionBar>

        {/* Table Card */}
        <div className="rounded-xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
          {filteredBottlenecks.length === 0 ? (
            <EmptyBlock
              title="No SLA bottlenecks found"
              body="All projects in this filter group are compliant with delivery schedules."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50/70 border-b border-stone-200">
                  <tr>
                    <Th className="w-[280px]">Deliverable Title</Th>
                    <Th>Brand</Th>
                    <Th>Editor</Th>
                    <Th>Internal DL</Th>
                    <Th>External DL</Th>
                    <Th>Delay Reason</Th>
                    <Th>Stage / Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDelays.map((p) => {
                    const notes = p.internalNotes || '';
                    const isEditorDelay = notes.includes('EDITOR DELAY');
                    const isBrandSlow = notes.includes('BRAND SLOW');
                    const isOverdue = notes.includes('OVERDUE') || p.overallStatus === '⚠️ OVERDUE';

                    return (
                      <tr
                        key={p.id}
                        className="group h-11 transition-colors border-b border-slate-200/60 hover:bg-slate-50/80"
                      >
                        <td className="px-3">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => {
                                setSelectedProject(p);
                                setIsModalOpen(true);
                              }}
                              className="font-semibold text-slate-900 text-[12.5px] hover:underline cursor-pointer truncate max-w-[240px]"
                            >
                              {p.title}
                            </span>
                          </div>
                        </td>

                        <td className="px-3">
                          <span className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                            {p.brandName}
                          </span>
                        </td>

                        <td className="px-3 text-[12px] font-medium text-slate-800">
                          {p.assigneeName || 'Unassigned'}
                        </td>

                        <td className="px-3 font-mono text-[11.5px] text-slate-600">
                          {p.deadline || '—'}
                        </td>

                        <td className="px-3 font-mono text-[11.5px] text-slate-600">
                          {p.targetDelivery || '—'}
                        </td>

                        <td className="px-3">
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
                        </td>

                        <td className="px-3 text-[12px] text-slate-700">
                          {p.clientStatus}
                        </td>

                        <td className="px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {activeRole === 'ADMIN' && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleExtendSLA(p)}
                                className="h-6 text-[11px] text-slate-700 hover:text-black"
                              >
                                Extend SLA
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setSelectedProject(p);
                                setIsModalOpen(true);
                              }}
                              className="h-6 text-[11px] font-semibold text-slate-700 hover:text-black"
                            >
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Clean Pagination */}
          {filteredBottlenecks.length > 0 && (
            <PaginationBar
              currentPage={page}
              totalItems={filteredBottlenecks.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[8, 15, 25, 45]}
            />
          )}
        </div>
      </PageBody>

      {/* Modal Dialogs */}
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

      {extendingProject && (
        <ExtendSLADialog
          project={extendingProject}
          isOpen={isExtendOpen}
          onClose={() => {
            setIsExtendOpen(false);
            setExtendingProject(null);
          }}
        />
      )}
    </Page>
  );
}
