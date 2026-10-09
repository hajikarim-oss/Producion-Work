import React from 'react';
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  Stat,
  StatStrip,
  EmptyBlock,
} from '@/components/layout/Page';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Project } from '@/lib/tbm/types';
import { RevisionRound } from '@/lib/tbm/types';
import { ProjectEditModal } from '@/components/tbm/ProjectEditModal';
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

export default function MyTasksPage() {
  const projects = useTBMStore((s) => s.projects);
  const members = useTBMStore((s) => s.members);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Selected member for queue inspection (in Admin mode, allows switching between any team member)
  const defaultMemberId =
    activeRole === 'CREATIVE'
      ? 'user_003' // Sneha
      : activeRole === 'EDITOR'
      ? 'user_002' // Ishan
      : 'ALL';

  const [selectedMemberId, setSelectedMemberId] = React.useState<string>(defaultMemberId);

  // Keep synced if role changes
  React.useEffect(() => {
    if (activeRole === 'CREATIVE') setSelectedMemberId('user_003');
    else if (activeRole === 'EDITOR') setSelectedMemberId('user_002');
    else setSelectedMemberId('ALL');
  }, [activeRole]);

  const [search, setSearch] = React.useState('');
  const [taskTab, setTaskTab] = React.useState<'ALL' | 'ACTIVE' | 'OVERDUE'>('ALL');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const currentMember = members.find((m) => m.id === selectedMemberId);

  const myProjects = React.useMemo(() => {
    if (selectedMemberId === 'ALL') {
      return projects;
    }
    return projects.filter(
      (p) =>
        p.assignedToId === selectedMemberId ||
        (currentMember && p.assigneeName.toLowerCase().includes(currentMember.name.toLowerCase())) ||
        (currentMember && p.assigneeEmail.toLowerCase() === currentMember.email.toLowerCase())
    );
  }, [projects, selectedMemberId, currentMember]);

  const activeTasks = React.useMemo(
    () => myProjects.filter((p) => p.currentStage !== 'DELIVERED' && p.currentStage !== 'CLOSED'),
    [myProjects]
  );

  const overdueTasks = React.useMemo(
    () => myProjects.filter((p) => p.overallStatus === '⚠️ OVERDUE'),
    [myProjects]
  );

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    return myProjects.filter((p) => {
      if (taskTab === 'ACTIVE' && (p.currentStage === 'DELIVERED' || p.currentStage === 'CLOSED')) return false;
      if (taskTab === 'OVERDUE' && p.overallStatus !== '⚠️ OVERDUE') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchBrand = p.brandName.toLowerCase().includes(q);
        if (!matchTitle && !matchBrand) return false;
      }
      return true;
    });
  }, [myProjects, taskTab, search]);

  // Paginated slice
  const paginatedTasks = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [selectedMemberId, search, taskTab, pageSize]);

  return (
    <Page>
      <PageTopbar
        title="My Tasks (Team Queue)"
        eyebrow="Layer 2: Team Member Operations • Direct Execution"
        subtitle="Personal worklist filtered to your assignments • Row-level permissions and focused editing fields"
      />

      <StatStrip cols={3}>
        <Stat
          label="Open Tasks"
          value={activeTasks.length}
          sub="active deliverables"
        />
        <Stat
          label="Overdue SLA"
          value={overdueTasks.length}
          accent={overdueTasks.length > 0}
          sub={overdueTasks.length > 0 ? "requires immediate action" : "on track"}
        />
        <Stat
          label="Total in Portfolio"
          value={myProjects.length}
          sub={selectedMemberId === 'ALL' ? 'agency portfolio' : `${currentMember?.name || 'Member'} roster`}
          last={true}
        />
      </StatStrip>

      <PageBody className="p-5 space-y-4">
        {/* Queue Profile & Scope Switcher */}
        <div className="rounded-xl border border-stone-200/90 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-stone-100 flex items-center justify-center text-slate-700">
              <User className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-medium">Viewing queue:</span>
              {activeRole === 'ADMIN' ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="h-7 px-2.5 rounded-md border border-stone-200/90 hover:border-stone-900 bg-white text-slate-900 text-[12px] font-semibold transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-800"
                  >
                    <option value="ALL">All Team Members ({projects.length} total tasks)</option>
                    {members.map((m) => {
                      const count = projects.filter((p) => p.assignedToId === m.id || p.assigneeName.toLowerCase().includes(m.name.toLowerCase())).length;
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.department}) — {count} deliverables
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div>
                  <strong className="text-slate-900">{currentMember?.name || 'Assigned Member'}</strong>{' '}
                  <span className="text-slate-400 font-mono">({currentMember?.email})</span>
                </div>
              )}
            </div>
          </div>
          <span className="font-mono text-[10.5px] text-slate-600 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
            Field Permissions: Edit Status, Revision Round & Notes Only
          </span>
        </div>

        <SectionBar
          label="Assigned Queue"
          count={filteredTasks.length}
          description="Your active tasks. Click any deliverable to update editing status, attach review links, or add notes."
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/70 p-0.5">
              <button
                onClick={() => setTaskTab('ALL')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  taskTab === 'ALL' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({myProjects.length})
              </button>
              <button
                onClick={() => setTaskTab('ACTIVE')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  taskTab === 'ACTIVE' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open ({activeTasks.length})
              </button>
              <button
                onClick={() => setTaskTab('OVERDUE')}
                className={`px-3 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  taskTab === 'OVERDUE' ? 'bg-white text-rose-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🔴 Overdue ({overdueTasks.length})
              </button>
            </div>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search queue…"
              className="w-44"
            />
          </div>
        </SectionBar>

        <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white shadow-xs">
          {paginatedTasks.length === 0 ? (
            <EmptyBlock
              title="No tasks found"
              body="No assigned tasks match your selected filter criteria."
            />
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-stone-50/70 border-b border-stone-200">
                    <tr>
                      <Th className="w-[300px]">Deliverable & Brand</Th>
                      <Th>Assigned To</Th>
                      <Th>Current Stage</Th>
                      <Th>Revision Round</Th>
                      <Th>Internal SLA</Th>
                      <Th>External Target</Th>
                      <Th>SLA Health</Th>
                      <Th className="text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTasks.map((p) => {
                      const isOverdue = p.overallStatus === '⚠️ OVERDUE';

                      return (
                        <tr
                          key={p.id}
                          className="border-b border-slate-200/60 hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900 text-[12.5px]">{p.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {p.brandName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60">
                                {p.contentType}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="text-[12px] font-medium text-slate-800">
                              {p.assigneeName || 'Unassigned'}
                            </span>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[11px] font-medium bg-stone-100 text-slate-700 px-2 py-0.5 rounded border border-stone-200/70">
                              {p.currentStage.replace(/_/g, ' ')}
                            </span>
                          </td>

                          <td className="px-3 py-2.5">
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10.5px] ${
                                p.revisionRound === RevisionRound.R3
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                  : p.revisionRound === RevisionRound.R2
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {p.revisionRound}
                            </Badge>
                          </td>

                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                            {p.deadline || '—'}
                          </td>

                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                            {p.targetDelivery || '—'}
                          </td>

                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                                isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {p.overallStatus || '✅ On Track'}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-right">
                            <Button
                              variant="default"
                              size="xs"
                              className="text-[11px] h-6 px-2.5 font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                              onClick={() => {
                                setSelectedProject(p);
                                setIsModalOpen(true);
                              }}
                            >
                              Edit Status
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationBar
                currentPage={page}
                totalItems={filteredTasks.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </div>
      </PageBody>

      {/* Edit Modal */}
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
    </Page>
  );
}
