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
import { ProjectStage, RevisionRound, ContentType } from '@/lib/tbm/types';
import { ProjectEditModal } from '@/components/tbm/ProjectEditModal';
import { CreateProjectDialog } from '@/components/tbm/CreateProjectDialog';
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Play,
  Clock,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

function Th({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] ${onClick ? 'cursor-pointer select-none hover:text-slate-900' : ''} ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

type QuickStatusTab = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'OVERDUE' | 'R3';
type SortField = 'title' | 'brand' | 'deadline' | 'stage';
type SortOrder = 'asc' | 'desc';

export default function AllProjectsPage() {
  const projects = useTBMStore((s) => s.projects);
  const brands = useTBMStore((s) => s.brands);
  const activeRole = useTBMStore((s) => s.activeRole);
  const triggerScheduledWorkflows = useTBMStore((s) => s.triggerScheduledWorkflows);

  const [search, setSearch] = React.useState('');
  const [selectedBrand, setSelectedBrand] = React.useState<string>('ALL');
  const [selectedFormat, setSelectedFormat] = React.useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = React.useState<string>('ALL');
  const [slaFilter, setSlaFilter] = React.useState<string>('ALL');
  const [statusTab, setStatusTab] = React.useState<QuickStatusTab>('ALL');

  // Sorting & Pagination States
  const [sortField, setSortField] = React.useState<SortField>('deadline');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(12);

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Simulated Row-level security for Layer 2 & Layer 3:
  const roleScopedProjects = React.useMemo(() => {
    if (activeRole === 'EDITOR') {
      return projects.filter((p) => p.assignedToId === 'user_002' || p.assigneeName.toLowerCase().includes('ishan') || p.department === 'EDITOR');
    }
    if (activeRole === 'CREATIVE') {
      return projects.filter((p) => p.department === 'CREATIVE');
    }
    if (activeRole === 'BRAND_POC') {
      return projects.filter((p) => (p.brandId === 'brand_002' || p.brandName === 'Big Leap') && p.isClientVisible !== false);
    }
    return projects;
  }, [projects, activeRole]);

  // Stats computed from role scoped projects
  const activeCount = React.useMemo(
    () => roleScopedProjects.filter((p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length,
    [roleScopedProjects]
  );

  const overdueCount = React.useMemo(
    () => roleScopedProjects.filter((p) => p.overallStatus === '⚠️ OVERDUE').length,
    [roleScopedProjects]
  );

  const r3Count = React.useMemo(
    () => roleScopedProjects.filter((p) => p.revisionRound === RevisionRound.R3).length,
    [roleScopedProjects]
  );

  const deliveredCount = React.useMemo(
    () => roleScopedProjects.filter((p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED).length,
    [roleScopedProjects]
  );

  // Multi-field filtered projects
  const filteredProjects = React.useMemo(() => {
    return roleScopedProjects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.assigneeName.toLowerCase().includes(q);

      const matchesBrand = selectedBrand === 'ALL' || p.brandId === selectedBrand;
      const matchesFormat = selectedFormat === 'ALL' || p.contentType === selectedFormat;

      // Status quick tab
      if (statusTab === 'ACTIVE' && (p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED)) return false;
      if (statusTab === 'DELIVERED' && p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED) return false;
      if (statusTab === 'OVERDUE' && p.overallStatus !== '⚠️ OVERDUE') return false;
      if (statusTab === 'R3' && p.revisionRound !== RevisionRound.R3) return false;

      let matchesPhase = true;
      if (selectedPhase === 'PHASE_1') {
        matchesPhase = [
          ProjectStage.BRIEF_RECEIVED,
          ProjectStage.BRIEF_CALL_DONE,
          ProjectStage.CONCEPT_IN_PROGRESS,
          ProjectStage.CONCEPT_SENT,
          ProjectStage.CONCEPT_APPROVED,
          ProjectStage.SCRIPT_IN_PROGRESS,
          ProjectStage.SCRIPT_APPROVED,
        ].includes(p.currentStage);
      } else if (selectedPhase === 'PHASE_2') {
        matchesPhase = [
          ProjectStage.PRE_PRODUCTION,
          ProjectStage.SHOOT_SCHEDULED,
          ProjectStage.SHOOT_DONE,
          ProjectStage.RAW_RECEIVED,
        ].includes(p.currentStage);
      } else if (selectedPhase === 'PHASE_3') {
        matchesPhase = [
          ProjectStage.EDIT_IN_PROGRESS,
          ProjectStage.FIRST_CUT_READY,
          ProjectStage.FIRST_CUT_SENT,
          ProjectStage.CLIENT_FEEDBACK,
        ].includes(p.currentStage);
      } else if (selectedPhase === 'PHASE_4') {
        matchesPhase = [
          ProjectStage.REVISION_R1,
          ProjectStage.REVISION_R2,
          ProjectStage.REVISION_R3,
          ProjectStage.FINAL_APPROVED,
          ProjectStage.DELIVERED,
          ProjectStage.INVOICED,
          ProjectStage.CLOSED,
        ].includes(p.currentStage);
      }

      let matchesSla = true;
      if (slaFilter === 'OVERDUE') {
        matchesSla = p.overallStatus === '⚠️ OVERDUE';
      } else if (slaFilter === 'ON_TRACK') {
        matchesSla = p.overallStatus !== '⚠️ OVERDUE';
      }

      return matchesSearch && matchesBrand && matchesFormat && matchesPhase && matchesSla;
    });
  }, [roleScopedProjects, search, selectedBrand, selectedFormat, selectedPhase, slaFilter, statusTab]);

  // Sorted projects
  const sortedProjects = React.useMemo(() => {
    return [...filteredProjects].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'brand') {
        comparison = a.brandName.localeCompare(b.brandName);
      } else if (sortField === 'stage') {
        comparison = a.currentStage.localeCompare(b.currentStage);
      } else if (sortField === 'deadline') {
        const da = a.deadline || a.targetDelivery || '';
        const db = b.deadline || b.targetDelivery || '';
        comparison = da.localeCompare(db);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredProjects, sortField, sortOrder]);

  // Paginated slice
  const paginatedProjects = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedProjects.slice(start, start + pageSize);
  }, [sortedProjects, page, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, selectedBrand, selectedFormat, selectedPhase, slaFilter, statusTab, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenEdit = (p: Project) => {
    setSelectedProject(p);
    setIsModalOpen(true);
  };

  const handleRunCrons = () => {
    const res = triggerScheduledWorkflows();
    toast.success(
      `Dispatched 8AM & 9AM Workflows! Found ${res.deadlineCount} deadline warnings and ${res.staleCount} stale tasks.`,
    );
  };

  const exportCSV = () => {
    const headers = ['ID', 'Title', 'Brand', 'Format', 'Stage', 'Client Status', 'Assignee', 'Deadline', 'SLA Health'];
    const rows = sortedProjects.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      p.brandName,
      p.contentType,
      p.currentStage,
      `"${p.clientStatus}"`,
      p.assigneeName,
      p.deadline || p.targetDelivery,
      p.overallStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tbm_projects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported deliverables to CSV');
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedBrand('ALL');
    setSelectedFormat('ALL');
    setSelectedPhase('ALL');
    setSlaFilter('ALL');
    setStatusTab('ALL');
  };

  const hasActiveFilters =
    search !== '' ||
    selectedBrand !== 'ALL' ||
    selectedFormat !== 'ALL' ||
    selectedPhase !== 'ALL' ||
    slaFilter !== 'ALL' ||
    statusTab !== 'ALL';

  return (
    <Page>
      <PageTopbar
        title={activeRole === 'BRAND_POC' ? 'Your Content Deliverables' : 'All Content Deliverables'}
        subtitle={
          activeRole === 'BRAND_POC'
            ? 'Transparent client-facing review and milestone tracking.'
            : 'Source of truth for all projects across brands, pipeline stages, and creative talent.'
        }
      >
        {activeRole === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <TopbarAction
              variant="ghost"
              icon={<Download className="w-3.5 h-3.5 text-slate-500" />}
              label="Export CSV"
              onClick={exportCSV}
            />
            <TopbarAction
              variant="ghost"
              icon={<Play className="w-3.5 h-3.5 text-amber-500" />}
              label="Run Daily Crons"
              onClick={handleRunCrons}
            />
            <TopbarAction
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              label="New Deliverable"
              onClick={() => setIsCreateOpen(true)}
            />
          </div>
        )}
      </PageTopbar>

      <StatStrip cols={4}>
        <Stat
          label="In Production"
          value={activeCount}
          sub="active deliverables"
        />
        <Stat
          label="SLA Overdue"
          value={overdueCount}
          accent={overdueCount > 0}
          sub={overdueCount > 0 ? "requires immediate action" : "all deliverables on track"}
        />
        <Stat
          label="Revision Alert (R3)"
          value={r3Count}
          accent={r3Count > 0}
          sub={r3Count > 0 ? "escalated to Sachin" : "within 2 revision limit"}
        />
        <Stat
          label="Completed & Closed"
          value={deliveredCount}
          sub="100% client signoff"
          last={true}
        />
      </StatStrip>

      <PageBody className="p-5 space-y-4">
        {/* Quick Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
            <button
              onClick={() => setStatusTab('ALL')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                statusTab === 'ALL'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({roleScopedProjects.length})
            </button>
            <button
              onClick={() => setStatusTab('ACTIVE')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                statusTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              In Flight ({activeCount})
            </button>
            <button
              onClick={() => setStatusTab('DELIVERED')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                statusTab === 'DELIVERED'
                  ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delivered ({deliveredCount})
            </button>
            <button
              onClick={() => setStatusTab('OVERDUE')}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                statusTab === 'OVERDUE'
                  ? 'bg-white text-rose-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔴 Overdue ({overdueCount})
            </button>
            {r3Count > 0 && (
              <button
                onClick={() => setStatusTab('R3')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  statusTab === 'R3'
                    ? 'bg-white text-amber-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚠️ R3 Escalated ({r3Count})
              </button>
            )}
          </div>

          {/* Search + Clear button */}
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search deliverables, brands, editors…"
              className="w-56"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="xs" onClick={clearFilters} className="text-xs text-slate-500 hover:text-black">
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* SectionBar with Sub-filters */}
        <SectionBar
          title="Master Production Table"
          count={sortedProjects.length}
          description="Filter across client accounts, format specifications, pipeline phases & delivery states."
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Filter */}
            {activeRole !== 'BRAND_POC' && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                aria-label="Filter by brand"
                className="h-7 px-2 text-[11.5px] rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300 transition-colors cursor-pointer focus:outline-hidden"
              >
                <option value="ALL">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Content Type Filter */}
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              aria-label="Filter by format"
              className="h-7 px-2 text-[11.5px] rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300 transition-colors cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All Formats</option>
              <option value={ContentType.REEL}>Reels</option>
              <option value={ContentType.VIDEO}>Long Videos</option>
              <option value={ContentType.CAROUSEL}>Carousels</option>
              <option value={ContentType.STATIC}>Statics</option>
              <option value={ContentType.STORY}>Stories</option>
            </select>

            {/* Production Phase Filter */}
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              aria-label="Filter by phase"
              className="h-7 px-2 text-[11.5px] rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:border-slate-300 transition-colors cursor-pointer focus:outline-hidden"
            >
              <option value="ALL">All 22 Stages</option>
              <option value="PHASE_1">Phase 1: Concept & Script</option>
              <option value="PHASE_2">Phase 2: Shoot & Raw Footage</option>
              <option value="PHASE_3">Phase 3: Assembly & First Cut</option>
              <option value="PHASE_4">Phase 4: Client Review & R1-R3</option>
            </select>
          </div>
        </SectionBar>

        {/* Master Table Card */}
        <div className="rounded-xl border border-stone-200/90 bg-white shadow-2xs overflow-hidden">
          {sortedProjects.length === 0 ? (
            <EmptyBlock
              title="No deliverables match these filters"
              body="Try clearing or adjusting your filter criteria to see active deliverables."
              cta={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50/70 border-b border-stone-200">
                  <tr>
                    <Th onClick={() => toggleSort('title')} className="w-[280px]">
                      <span className="flex items-center gap-1">
                        Deliverable Title <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </span>
                    </Th>
                    {activeRole !== 'BRAND_POC' && (
                      <Th onClick={() => toggleSort('brand')}>
                        <span className="flex items-center gap-1">
                          Brand <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </Th>
                    )}
                    <Th>Format</Th>
                    {activeRole !== 'BRAND_POC' && (
                      <Th onClick={() => toggleSort('stage')}>
                        <span className="flex items-center gap-1">
                          Pipeline Stage <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </span>
                      </Th>
                    )}
                    <Th>Client Status</Th>
                    <Th>Round</Th>
                    {activeRole !== 'BRAND_POC' && <Th>Assigned To</Th>}
                    <Th onClick={() => toggleSort('deadline')}>
                      <span className="flex items-center gap-1">
                        SLA Deadline <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </span>
                    </Th>
                    <Th>Overall Health</Th>
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((p) => {
                    const isOverdue = p.overallStatus === '⚠️ OVERDUE';
                    const isR3 = p.revisionRound === RevisionRound.R3;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleOpenEdit(p)}
                        className={`group h-11 transition-colors cursor-pointer border-b border-slate-200/60 ${
                          isOverdue
                            ? 'bg-rose-50/20 hover:bg-rose-50/40'
                            : isR3
                            ? 'bg-amber-50/20 hover:bg-amber-50/40'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-[12.5px] group-hover:text-black truncate max-w-[240px]">
                              {p.title}
                            </span>
                            {isR3 && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60 inline-flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3" />
                                R3
                              </span>
                            )}
                          </div>
                        </td>

                        {activeRole !== 'BRAND_POC' && (
                          <td className="px-3">
                            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 whitespace-nowrap">
                              {p.brandName}
                            </span>
                          </td>
                        )}

                        <td className="px-3">
                          <span className="text-[11.5px] text-slate-500 font-medium">
                            {p.contentType}
                          </span>
                        </td>

                        {activeRole !== 'BRAND_POC' && (
                          <td className="px-3">
                            <span className="font-mono text-[11px] text-slate-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60 whitespace-nowrap">
                              {p.currentStage.replace(/_/g, ' ')}
                            </span>
                          </td>
                        )}

                        <td className="px-3">
                          <span className="text-[11.5px] font-medium text-slate-700">
                            {p.clientStatus}
                          </span>
                        </td>

                        <td className="px-3">
                          <span
                            className={`font-mono text-[10.5px] font-semibold px-2 py-0.5 rounded ${
                              isR3
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                            }`}
                          >
                            {p.revisionRound}
                          </span>
                        </td>

                        {activeRole !== 'BRAND_POC' && (
                          <td className="px-3 font-medium text-[12px] text-slate-700">
                            {p.assigneeName || 'Unassigned'}
                          </td>
                        )}

                        <td className="px-3">
                          <div className="flex items-center gap-1.5 text-[11.5px]">
                            <Clock
                              className={`w-3.5 h-3.5 ${
                                isOverdue ? 'text-rose-500' : 'text-slate-400'
                              }`}
                            />
                            <span
                              className={`font-mono ${
                                isOverdue
                                  ? 'text-rose-700 font-bold'
                                  : 'text-slate-600'
                              }`}
                            >
                              {p.deadline || p.targetDelivery || '—'}
                            </span>
                          </div>
                        </td>

                        <td className="px-3">
                          <span
                            className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.overallStatus}
                          </span>
                        </td>

                        <td className="px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(p);
                            }}
                            className="text-[11.5px] font-semibold text-slate-600 hover:text-black underline cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Clean Reusable Pagination Component */}
          {sortedProjects.length > 0 && (
            <PaginationBar
              currentPage={page}
              totalItems={sortedProjects.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[12, 25, 50, 100]}
            />
          )}
        </div>
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
