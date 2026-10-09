import React from 'react';
import {
  Page,
  PageBody,
  PageTopbar,
  SectionBar,
  Stat,
  StatStrip,
  TopbarAction,
} from '@/components/layout/Page';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Project, Brand } from '@/lib/tbm/types';
import { ProjectStage, RevisionRound, ContentType, ClientStatus } from '@/lib/tbm/types';
import { ProjectEditModal } from '@/components/tbm/ProjectEditModal';
import { CreateProjectDialog } from '@/components/tbm/CreateProjectDialog';
import { CreateBrandDialog } from '@/components/tbm/CreateBrandDialog';
import { EditBrandDialog } from '@/components/tbm/EditBrandDialog';
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Mail,
  User,
  Plus,
  ChevronDown,
  ChevronRight,
  Clock,
  Settings2,
  Phone,
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

export default function ProjectsBrandsPage() {
  const brands = useTBMStore((s) => s.brands);
  const projects = useTBMStore((s) => s.projects);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [selectedBrandId, setSelectedBrandId] = React.useState<string | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [collapsedBrands, setCollapsedBrands] = React.useState<Record<string, boolean>>({});
  const [brandPages, setBrandPages] = React.useState<Record<string, number>>({});
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createForBrandId, setCreateForBrandId] = React.useState<string | undefined>(undefined);

  const [isCreateBrandOpen, setIsCreateBrandOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [isEditBrandOpen, setIsEditBrandOpen] = React.useState(false);

  const toggleBrandCollapse = (brandId: string) => {
    setCollapsedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }));
  };

  const handleCreateProjectForBrand = (brand: Brand) => {
    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can initialize new brand deliverables');
      return;
    }
    setCreateForBrandId(brand.id);
    setIsCreateOpen(true);
  };

  const filteredBrands = brands.filter((b) => {
    if (selectedBrandId !== 'ALL' && b.id !== selectedBrandId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchPoc = b.pocName.toLowerCase().includes(q);
      const matchEmail = b.pocEmail.toLowerCase().includes(q);
      if (!matchName && !matchPoc && !matchEmail) return false;
    }
    return true;
  });

  const activeProjectsCount = projects.filter((p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED).length;
  const completedProjectsCount = projects.filter((p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED).length;

  return (
    <Page>
      <PageTopbar
        title="Brands & Retainer Portfolios"
        subtitle="Manage client accounts, designated POC communication channels, and active deliverables."
      >
        {activeRole === 'ADMIN' && (
          <TopbarAction
            variant="ghost"
            icon={<Building2 className="w-3.5 h-3.5 text-indigo-600" />}
            label="New Brand Retainer"
            onClick={() => setIsCreateBrandOpen(true)}
          />
        )}
        <TopbarAction
          variant="primary"
          icon={<Plus className="w-3.5 h-3.5" />}
          label="New Deliverable"
          onClick={() => {
            if (brands[0]) handleCreateProjectForBrand(brands[0]);
          }}
        />
      </PageTopbar>

      <StatStrip cols={4}>
        <Stat
          label="Client Retainers"
          value={brands.length}
          sub="active client portfolio"
        />
        <Stat
          label="In Production"
          value={activeProjectsCount}
          sub="across all tiers"
        />
        <Stat
          label="Delivered & Closed"
          value={completedProjectsCount}
          sub="100% client signoff"
        />
        <Stat
          label="Retainer Health"
          value="96%"
          sub="on-track fulfillment"
        />
      </StatStrip>

      <PageBody className="p-5 space-y-5">
        <SectionBar
          label="Client Accounts"
          count={filteredBrands.length}
          description="Projects organized by client brand identity, retainer health, and designated client contact points."
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-slate-500 font-medium">Filter Brand:</span>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="h-7 px-2.5 rounded-md border border-stone-200/90 hover:border-stone-900 bg-white text-slate-800 text-[12px] font-medium transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="ALL">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.tier || 'Active'})
                </option>
              ))}
            </select>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search brands, POC…"
              className="w-44"
            />
          </div>
        </SectionBar>

        <div className="space-y-6">
          {filteredBrands.map((brand) => {
            const brandProjects = projects.filter((p) => p.brandId === brand.id);
            const activeProjects = brandProjects.filter(
              (p) => p.currentStage !== ProjectStage.DELIVERED && p.currentStage !== ProjectStage.CLOSED,
            );
            const deliveredCount = brandProjects.filter(
              (p) => p.currentStage === ProjectStage.DELIVERED || p.currentStage === ProjectStage.CLOSED,
            ).length;
            const progressPercent = brandProjects.length > 0
              ? Math.round((deliveredCount / brandProjects.length) * 100)
              : 0;
            const isCollapsed = collapsedBrands[brand.id] || false;

            return (
              <div key={brand.id} className="apollo-card overflow-hidden">
                {/* Brand Header */}
                <div className="p-4 bg-stone-50/70 border-b border-stone-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-500 hover:text-slate-900"
                      onClick={() => toggleBrandCollapse(brand.id)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>

                    <div
                      className="h-9 w-9 rounded-md border flex items-center justify-center font-bold text-xs shadow-xs"
                      style={{
                        backgroundColor: brand.primaryColor ? `${brand.primaryColor}15` : '#18181B10',
                        borderColor: brand.primaryColor || '#18181B',
                        color: brand.primaryColor || '#18181B',
                      }}
                    >
                      {brand.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-950 text-[13.5px]">{brand.name}</h3>
                        <span className="font-mono text-[10.5px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60 font-semibold">
                          {brand.tier || 'Client'}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 font-semibold uppercase">
                          {brand.status || 'ACTIVE'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          POC: {brand.pocName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {brand.pocEmail}
                        </span>
                        {brand.pocPhone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {brand.pocPhone}
                            </span>
                          </>
                        )}
                        {activeRole === 'ADMIN' && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-700 font-semibold">
                              ₹{(brand.monthlyRetainer || 0).toLocaleString('en-IN')}/mo
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-32 hidden sm:block">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                        <span>Fulfillment</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeRole === 'ADMIN' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setEditingBrand(brand);
                            setIsEditBrandOpen(true);
                          }}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          Retainer
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 text-xs gap-1 font-semibold"
                        onClick={() => handleCreateProjectForBrand(brand)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Deliverable
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Brand Projects Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {brandProjects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No deliverables assigned to {brand.name} yet. Click "Deliverable" to initialize one.
                      </div>
                    ) : (
                      <>
                        <table className="w-full text-left">
                        <thead className="bg-white border-b border-stone-200">
                          <tr>
                            <Th className="w-[280px]">Deliverable Title</Th>
                            <Th>Format</Th>
                            <Th>Pipeline Stage</Th>
                            <Th>Client Status</Th>
                            <Th>Round</Th>
                            <Th>Assigned To</Th>
                            <Th>Target Delivery</Th>
                            <Th>Overall Health</Th>
                            <Th className="text-right">Action</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {brandProjects.slice(((brandPages[brand.id] || 1) - 1) * 6, (brandPages[brand.id] || 1) * 6).map((p) => {
                            const isOverdue = p.overallStatus === '⚠️ OVERDUE';

                            return (
                              <tr
                                key={p.id}
                                onClick={() => {
                                  setSelectedProject(p);
                                  setIsModalOpen(true);
                                }}
                                className="group h-11 border-b border-slate-200/60 hover:bg-slate-50/80 transition-colors cursor-pointer"
                              >
                                <td className="px-3 font-semibold text-slate-900 text-[12.5px] group-hover:text-black">
                                  {p.title}
                                </td>

                                <td className="px-3 text-[11.5px] text-slate-500 font-medium">
                                  {p.contentType}
                                </td>

                                <td className="px-3">
                                  <span className="font-mono text-[11px] text-slate-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60">
                                    {p.currentStage.replace(/_/g, ' ')}
                                  </span>
                                </td>

                                <td className="px-3">
                                  <span className="text-[11.5px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                                    {p.clientStatus}
                                  </span>
                                </td>

                                <td className="px-3">
                                  <span className="font-mono text-[10.5px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                                    {p.revisionRound}
                                  </span>
                                </td>

                                <td className="px-3 font-medium text-[12px] text-slate-700">
                                  {p.assigneeName || 'Unassigned'}
                                </td>

                                <td className="px-3">
                                  <div className="flex items-center gap-1 text-[11.5px]">
                                    <Clock
                                      className={`w-3.5 h-3.5 ${
                                        isOverdue ? 'text-rose-500' : 'text-slate-400'
                                      }`}
                                    />
                                    <span
                                      className={
                                        isOverdue
                                          ? 'font-bold text-rose-600 font-mono'
                                          : 'text-slate-600 font-mono'
                                      }
                                    >
                                      {p.deadline || p.targetDelivery}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-3">
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${
                                      isOverdue
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {p.overallStatus}
                                  </span>
                                </td>

                                <td className="px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProject(p);
                                      setIsModalOpen(true);
                                    }}
                                    className="h-7 text-xs text-slate-700 hover:text-slate-900"
                                  >
                                    Inspect
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {brandProjects.length > 6 && (
                        <PaginationBar
                          currentPage={brandPages[brand.id] || 1}
                          totalItems={brandProjects.length}
                          pageSize={6}
                          onPageChange={(p) => setBrandPages((prev) => ({ ...prev, [brand.id]: p }))}
                        />
                      )}
                    </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PageBody>

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
        onClose={() => {
          setIsCreateOpen(false);
          setCreateForBrandId(undefined);
        }}
        defaultBrandId={createForBrandId}
      />

      <CreateBrandDialog
        isOpen={isCreateBrandOpen}
        onClose={() => setIsCreateBrandOpen(false)}
      />

      <EditBrandDialog
        brand={editingBrand}
        isOpen={isEditBrandOpen}
        onClose={() => {
          setIsEditBrandOpen(false);
          setEditingBrand(null);
        }}
      />
    </Page>
  );
}
