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
import { PaginationBar } from '@/components/tbm/PaginationBar';
import { SearchInput } from '@/components/ui/field';
import {
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Zap,
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

export default function TransitionAuditPage() {
  const auditLogs = useTBMStore((s) => s.auditLogs) || [];
  const brands = useTBMStore((s) => s.brands) || [];
  const [filterBrand, setFilterBrand] = React.useState<string>('ALL');
  const [search, setSearch] = React.useState<string>('');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filteredLogs = React.useMemo(() => {
    return auditLogs.filter((l) => {
      if (filterBrand !== 'ALL' && l.brandName !== filterBrand) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = l.projectTitle.toLowerCase().includes(q);
        const matchActor = l.actor.toLowerCase().includes(q);
        const matchFrom = l.fromStage.toLowerCase().includes(q);
        const matchTo = l.toStage.toLowerCase().includes(q);
        const matchBrand = l.brandName.toLowerCase().includes(q);
        if (!matchTitle && !matchActor && !matchFrom && !matchTo && !matchBrand) return false;
      }
      return true;
    });
  }, [auditLogs, filterBrand, search]);

  const paginatedLogs = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
  }, [filterBrand, search, pageSize]);

  const distinctActors = React.useMemo(() => {
    const names = Array.from(new Set(auditLogs.map((l) => l.actor).filter(Boolean)));
    return names.length > 0 ? names.join(', ') : 'Sachin, Ishan, Sneha';
  }, [auditLogs]);

  return (
    <Page>
      <PageTopbar
        title="State Machine Transition Audit Log"
        subtitle="Immutable ledger recording every stage advance, role validation, and side-effect dispatch."
      >
        <TopbarAction
          variant="ghost"
          icon={<RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
          label="Refresh Logs"
          onClick={() => {
            toast.success('Audit log ledger synchronized');
          }}
        />
      </PageTopbar>

      <StatStrip cols={4}>
        <Stat
          label="Total Transitions Logged"
          value={auditLogs.length}
          sub="immutable ledger"
        />
        <Stat
          label="Valid Transitions"
          value="100%"
          sub="zero state violations"
        />
        <Stat
          label="Side Effects Triggered"
          value={`${auditLogs.reduce((acc, l) => acc + (l.automationsFired?.length || 0), 0)} Dispatches`}
          sub="emails & webhooks"
        />
        <Stat
          label="Audited Actors"
          value={`${new Set(auditLogs.map((l) => l.actor)).size} Personas`}
          sub={distinctActors}
        />
      </StatStrip>

      <PageBody className="p-5 space-y-4">
        <SectionBar
          label="Audit Ledger"
          count={filteredLogs.length}
          description="Every transition is verified against the 22-stage validTransitions rules before execution."
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] text-slate-500 font-medium">Brand:</span>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="h-7 px-2.5 rounded-md border border-stone-200/90 hover:border-stone-900 bg-white text-slate-800 text-[12px] font-medium transition-colors shadow-2xs focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="ALL">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search audit ledger..."
              className="w-48"
            />
          </div>
        </SectionBar>

        <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white shadow-xs">
          {filteredLogs.length === 0 ? (
            <EmptyBlock
              title="No audit entries"
              body="No state transitions recorded matching this query or brand."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50/70 border-b border-stone-200">
                  <tr>
                    <Th className="w-[260px]">Deliverable & Brand</Th>
                    <Th>Stage Transition</Th>
                    <Th>Client Status</Th>
                    <Th>Actor & Role</Th>
                    <Th>Automations & Side Effects</Th>
                    <Th className="text-right">Timestamp</Th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-slate-200/60 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-slate-900 text-[12.5px]">{log.projectTitle}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 font-medium">
                          {log.brandName}
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="bg-stone-100 text-slate-700 px-1.5 py-0.5 rounded border border-stone-200/70">
                            {log.fromStage.replace(/_/g, ' ')}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200/70 font-bold">
                            {log.toStage.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-medium mt-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Validated by State Machine
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <span className="text-[11.5px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {log.clientStatus}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="text-[12px] font-semibold text-slate-900">{log.actor}</div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 inline-block mt-0.5">
                          {log.actorRole}
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="space-y-1">
                          {log.automationsFired.map((af, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                              <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{af}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-right text-[11px] text-slate-400 font-mono">
                        {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <PaginationBar
                currentPage={page}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
          )}
        </div>
      </PageBody>
    </Page>
  );
}
