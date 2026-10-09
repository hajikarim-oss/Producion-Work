import React from 'react';
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  TopbarAction,
} from '@/components/layout/Page';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Project } from '@/lib/tbm/types';
import { ProjectStage, RevisionRound, VALID_STAGE_TRANSITIONS } from '@/lib/tbm/types';
import { ProjectEditModal } from '@/components/tbm/ProjectEditModal';
import { CreateProjectDialog } from '@/components/tbm/CreateProjectDialog';
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
import { SearchInput } from '@/components/ui/field';
import {
  User,
  ArrowRight,
  Plus,
  GitBranch,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface KanbanColumnDef {
  key: string;
  label: string;
  phase: string;
  stages: ProjectStage[];
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    key: 'BRIEF',
    label: '1. Brief & Alignment',
    phase: 'CREATIVE',
    stages: [ProjectStage.BRIEF_RECEIVED, ProjectStage.BRIEF_CALL_DONE],
  },
  {
    key: 'CONCEPT',
    label: '2. Concept & Scripting',
    phase: 'CREATIVE',
    stages: [
      ProjectStage.CONCEPT_IN_PROGRESS,
      ProjectStage.CONCEPT_SENT,
      ProjectStage.CONCEPT_APPROVED,
      ProjectStage.SCRIPT_IN_PROGRESS,
      ProjectStage.SCRIPT_APPROVED,
    ],
  },
  {
    key: 'PRODUCTION',
    label: '3. Pre-Prod & Shoot',
    phase: 'PRODUCTION',
    stages: [
      ProjectStage.PRE_PRODUCTION,
      ProjectStage.SHOOT_SCHEDULED,
      ProjectStage.SHOOT_DONE,
      ProjectStage.RAW_RECEIVED,
    ],
  },
  {
    key: 'EDITING',
    label: '4. Edit in Progress',
    phase: 'EDITORIAL',
    stages: [ProjectStage.EDIT_IN_PROGRESS, ProjectStage.FIRST_CUT_READY],
  },
  {
    key: 'REVIEW',
    label: '5. Client Review (V1 Cut)',
    phase: 'EDITORIAL',
    stages: [ProjectStage.FIRST_CUT_SENT, ProjectStage.CLIENT_FEEDBACK],
  },
  {
    key: 'REVISIONS',
    label: '6. Refining & Polish',
    phase: 'REVISION',
    stages: [
      ProjectStage.REVISION_R1,
      ProjectStage.REVISION_R2,
      ProjectStage.REVISION_R3,
    ],
  },
  {
    key: 'DELIVERY',
    label: '7. Approval & Mastered',
    phase: 'REVISION',
    stages: [
      ProjectStage.FINAL_APPROVED,
      ProjectStage.DELIVERED,
      ProjectStage.INVOICED,
      ProjectStage.CLOSED,
    ],
  },
];

export default function PipelineKanbanPage() {
  const projects = useTBMStore((s) => s.projects);
  const activeRole = useTBMStore((s) => s.activeRole);
  const updateProject = useTBMStore((s) => s.updateProject);

  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [activePhase, setActivePhase] = React.useState<string>('ALL');

  const [branchingProject, setBranchingProject] = React.useState<Project | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = React.useState(false);

  const brands = useTBMStore((s) => s.brands);
  const [selectedBrand, setSelectedBrand] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');
  const [bottleneckOnly, setBottleneckOnly] = React.useState<boolean>(false);

  // Scoped per role
  const scopedProjects = React.useMemo(() => {
    let list = projects;
    if (activeRole === 'EDITOR') {
      list = projects.filter((p) => p.assignedToId === 'user_002' || p.assigneeName.toLowerCase().includes('ishan') || p.department === 'EDITOR');
    } else if (activeRole === 'CREATIVE') {
      list = projects.filter((p) => p.department === 'CREATIVE');
    } else if (activeRole === 'BRAND_POC') {
      list = projects.filter((p) => (p.brandId === 'brand_002' || p.brandName === 'Big Leap') && p.isClientVisible !== false);
    }

    if (selectedBrand !== 'ALL') {
      list = list.filter((p) => p.brandId === selectedBrand);
    }
    if (bottleneckOnly) {
      list = list.filter((p) => {
        const notes = p.internalNotes || '';
        return notes.includes('DELAY') || notes.includes('OVERDUE') || notes.includes('BRAND SLOW') || p.overallStatus === '⚠️ OVERDUE';
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || p.assigneeName.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q));
    }
    return list;
  }, [projects, activeRole, selectedBrand, bottleneckOnly, search]);

  const handleAdvanceClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeRole === 'BRAND_POC' || activeRole === 'EDITOR') {
      toast.error('Only Sachin (Admin) or Lead Manager can transition pipeline stages.');
      return;
    }

    const nextStages = VALID_STAGE_TRANSITIONS[project.currentStage] || [];
    if (nextStages.length === 0) {
      toast.error(`Project is in terminal stage: ${project.currentStage}`);
      return;
    }

    if (nextStages.length === 1) {
      const next = nextStages[0];
      const res = updateProject(project.id, { currentStage: next });
      if (res.success) {
        toast.success(`Advanced "${project.title}" to ${next.replace(/_/g, ' ')}!`);
      }
    } else {
      setBranchingProject(project);
      setIsBranchModalOpen(true);
    }
  };

  const handleChooseBranch = (targetStage: ProjectStage) => {
    if (!branchingProject) return;
    const res = updateProject(branchingProject.id, { currentStage: targetStage });
    if (res.success) {
      toast.success(`Advanced "${branchingProject.title}" to ${targetStage.replace(/_/g, ' ')}!`);
    }
    setIsBranchModalOpen(false);
    setBranchingProject(null);
  };

  const visibleColumns = KANBAN_COLUMNS.filter((col) => {
    if (activePhase === 'ALL') return true;
    return col.phase === activePhase;
  });

  return (
    <Page>
      <PageTopbar
        title="Production Pipeline (Kanban)"
        eyebrow="Workflow State Machine • 22 Stages"
        subtitle="Visual pipeline across all production phases with strictly enforced legal transitions."
      >
        {activeRole === 'ADMIN' && (
          <TopbarAction
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            label="New Deliverable"
            onClick={() => setIsCreateOpen(true)}
          />
        )}
      </PageTopbar>

      {/* Phase Selection Strip & Brand / Search Controls */}
      <SectionBar
        label="Pipeline Phase"
        count={scopedProjects.length}
        description="Filter kanban columns to isolate key production stages and client accounts."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: 'All 7 Columns' },
              { id: 'CREATIVE', label: 'Phase 1: Creative' },
              { id: 'PRODUCTION', label: 'Phase 2: Shoot' },
              { id: 'EDITORIAL', label: 'Phase 3: Editorial' },
              { id: 'REVISION', label: 'Phase 4: Polish & Delivery' },
            ].map((tab) => {
              const isActive = activePhase === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePhase(tab.id)}
                  className={`px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
                    isActive ? 'apollo-pill-active' : 'apollo-pill-inactive'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-stone-300 mx-1 hidden sm:block" />

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

          {/* Bottlenecks toggle */}
          <button
            onClick={() => setBottleneckOnly(!bottleneckOnly)}
            className={`h-7 px-2.5 rounded-md text-[11.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
              bottleneckOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Bottlenecks Only
          </button>

          {/* Search bar */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search cards…"
            className="w-40"
          />
        </div>
      </SectionBar>

      <PageBody className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-[1350px] items-start pb-6">
          {visibleColumns.map((col) => {
            const colProjects = scopedProjects.filter((p) =>
              col.stages.includes(p.currentStage),
            );
            const lateCount = colProjects.filter((p) => {
              const notes = p.internalNotes || '';
              return notes.includes('DELAY') || notes.includes('OVERDUE') || notes.includes('BRAND SLOW') || p.overallStatus === '⚠️ OVERDUE';
            }).length;

            return (
              <div
                key={col.key}
                className="w-72 shrink-0 rounded-xl bg-stone-50/70 border border-stone-200/90 p-3 flex flex-col max-h-[calc(100vh-170px)] shadow-2xs"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/80">
                  <span className="font-semibold text-[12px] text-slate-900 tracking-tight">
                    {col.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] bg-stone-200/70 text-slate-700 px-1.5 py-0.2 rounded font-semibold tabular-nums">
                      {colProjects.length}
                    </span>
                    {lateCount > 0 && (
                      <span className="font-mono text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold tabular-nums">
                        {lateCount} late
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                  {colProjects.map((p) => {
                    const isOverdue = p.overallStatus === '⚠️ OVERDUE';
                    const allowedNext = VALID_STAGE_TRANSITIONS[p.currentStage] || [];

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProject(p);
                          setIsModalOpen(true);
                        }}
                        className="apollo-card p-3 hover:border-slate-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span className="text-slate-900 font-bold uppercase tracking-wider text-[10.5px]">
                            {p.brandName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                            {p.contentType}
                          </span>
                        </div>

                        <div className="font-bold text-[12.5px] text-slate-950 leading-snug group-hover:text-black">
                          {p.title}
                        </div>

                        <div className="text-[11px] font-medium text-slate-800 bg-stone-100 px-2 py-1 rounded border border-stone-200/70 flex items-center justify-between">
                          <span className="truncate">{p.currentStage.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-slate-900 font-mono font-bold shrink-0 ml-1">
                            {p.revisionRound}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="flex items-center gap-1 font-medium truncate max-w-[130px]">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{p.assigneeName}</span>
                          </span>
                          <span
                            className={`font-mono text-[10.5px] font-semibold shrink-0 ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            {p.deadline || p.targetDelivery}
                          </span>
                        </div>

                        {allowedNext.length > 0 && activeRole !== 'EDITOR' && activeRole !== 'BRAND_POC' && (
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {allowedNext.length > 1
                                ? `${allowedNext.length} Branch Paths`
                                : `Next: ${allowedNext[0].replace(/_/g, ' ')}`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleAdvanceClick(p, e)}
                              className="h-5 px-2 text-[10px] shrink-0 font-semibold gap-1 apollo-btn-primary rounded-md inline-flex items-center cursor-pointer"
                            >
                              {allowedNext.length > 1 ? (
                                <>
                                  <GitBranch className="w-2.5 h-2.5" /> Branch
                                </>
                              ) : (
                                <>
                                  Advance <ArrowRight className="w-2.5 h-2.5" />
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colProjects.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No deliverables in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PageBody>

      {/* Branching Stage Selection Dialog */}
      <Dialog open={isBranchModalOpen} onOpenChange={setIsBranchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <GitBranch className="w-4 h-4 text-amber-500" />
              State Machine Stage Branching
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Multiple legal transitions exist from{' '}
              <strong className="text-slate-900">{branchingProject?.currentStage.replace(/_/g, ' ')}</strong>.
              Select the intended target stage:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            {branchingProject &&
              (VALID_STAGE_TRANSITIONS[branchingProject.currentStage] || []).map((target) => (
                <button
                  key={target}
                  onClick={() => handleChooseBranch(target)}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white hover:bg-stone-50 text-left flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                      ➔ {target.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Valid state-machine progression path
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsBranchModalOpen(false);
                setBranchingProject(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectEditModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProject(null);
        }}
      />

      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </Page>
  );
}
