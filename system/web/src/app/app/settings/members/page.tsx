import React from 'react';
import {
  SectionShell,
  Section,
  Row,
} from '../_components/SectionShell';
import { TextInput, Label } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TeamMemberRecord {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Editor' | 'Creative' | 'Brand POC';
  department: 'CREATIVE' | 'EDITOR' | 'PRODUCTION' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
  permissionsScope: string;
}

const SEED_MEMBERS: TeamMemberRecord[] = [
  {
    id: 'usr_sachin_admin',
    name: 'Sachin',
    email: 'sachin@theboredmonkey.com',
    role: 'Admin',
    department: 'CREATIVE',
    status: 'ACTIVE',
    joinDate: '2024-01-15',
    permissionsScope: 'Full CRUD across all objects, workflows & billing',
  },
  {
    id: 'usr_priya_creative',
    name: 'Priya Sharma',
    email: 'priya@theboredmonkey.com',
    role: 'Creative',
    department: 'CREATIVE',
    status: 'ACTIVE',
    joinDate: '2024-03-01',
    permissionsScope: 'Concepts, scripts & storyboard pipelines',
  },
  {
    id: 'usr_ishan_editor',
    name: 'Ishan Verma',
    email: 'ishan@theboredmonkey.com',
    role: 'Editor',
    department: 'EDITOR',
    status: 'ACTIVE',
    joinDate: '2024-02-10',
    permissionsScope: 'Assigned cuts, editStatus, revisionRound (Row-level locked)',
  },
  {
    id: 'usr_rahul_motion',
    name: 'Rahul Nair',
    email: 'rahul@theboredmonkey.com',
    role: 'Editor',
    department: 'EDITOR',
    status: 'ACTIVE',
    joinDate: '2024-05-20',
    permissionsScope: 'Assigned cuts, editStatus, revisionRound (Row-level locked)',
  },
  {
    id: 'usr_ananya_atomberg',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@atomberg.com',
    role: 'Brand POC',
    department: 'CLIENT',
    status: 'ACTIVE',
    joinDate: '2024-06-01',
    permissionsScope: 'Atomberg deliverables only, review feedback & signoff',
  },
  {
    id: 'usr_rohan_minimalist',
    name: 'Rohan Verma',
    email: 'rohan.v@beminimalist.co',
    role: 'Brand POC',
    department: 'CLIENT',
    status: 'ACTIVE',
    joinDate: '2024-07-12',
    permissionsScope: 'Minimalist deliverables only, review feedback & signoff',
  },
];

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-[0.14em] ${className ?? ''}`}
    >
      {children}
    </th>
  );
}

export default function MembersSettingsPage() {
  const [members, setMembers] = React.useState<TeamMemberRecord[]>(SEED_MEMBERS);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteName, setInviteName] = React.useState('');
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<'Editor' | 'Creative' | 'Brand POC' | 'Manager'>('Editor');
  const [inviteDept, setInviteDept] = React.useState<'CREATIVE' | 'EDITOR' | 'PRODUCTION'>('EDITOR');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error('Please provide name and email');
      return;
    }

    const newMember: TeamMemberRecord = {
      id: `usr_${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      department: inviteDept,
      status: 'ACTIVE',
      joinDate: new Date().toISOString().split('T')[0],
      permissionsScope: `${inviteRole} role access scope`,
    };

    setMembers((prev) => [...prev, newMember]);
    toast.success(`Invitation dispatched to ${inviteEmail} (Workflow 7 triggered)`);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  return (
    <SectionShell
      title="Workspace Members & Roles"
      description="Twenty WorkspaceMember standard object extended with department, status, and role-based permissions."
      actions={
        <Button
          onClick={() => setIsInviteOpen(true)}
          variant="default"
          size="sm"
          className="gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Member
        </Button>
      }
    >
      <Section
        eyebrow="Active Team & Client Roster"
        description="Standard WorkspaceMember records extended with custom Twenty fields via defineField()."
      >
        <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left">
            <thead className="bg-stone-50/70 border-b border-slate-200">
              <tr>
                <Th className="w-[200px]">Member Name</Th>
                <Th>Email Address</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Permission Scope</Th>
                <Th>Status</Th>
                <Th className="text-right">Join Date</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const isBrand = m.role === 'Brand POC';
                const isAdmin = m.role === 'Admin';
                const isEditor = m.role === 'Editor';

                return (
                  <tr
                    key={m.id}
                    className="h-11 border-b border-slate-200/60 hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-3">
                      <div className="font-semibold text-slate-900 text-[12.5px] flex items-center gap-2">
                        {isAdmin && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                        {isEditor && <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />}
                        {isBrand && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        <span>{m.name}</span>
                      </div>
                    </td>

                    <td className="px-3 text-slate-500 font-mono text-[11.5px]">
                      {m.email}
                    </td>

                    <td className="px-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${
                          isAdmin
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            : isBrand
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>

                    <td className="px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          m.department === 'CREATIVE'
                            ? 'bg-purple-100 text-purple-800'
                            : m.department === 'EDITOR'
                            ? 'bg-blue-100 text-blue-800'
                            : m.department === 'CLIENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.department}
                      </span>
                    </td>

                    <td className="px-3 text-[11.5px] text-slate-600 max-w-xs truncate">
                      {m.permissionsScope}
                    </td>

                    <td className="px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {m.status}
                      </span>
                    </td>

                    <td className="px-3 text-right font-mono text-[11px] text-slate-400">
                      {m.joinDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        eyebrow="Three-Layer Security Model"
        description="Architectural boundaries enforced by Twenty workspace guards and role simulation."
      >
        <Row
          label="Layer 1: Master Admin (Sachin)"
          description="Full CRUD permissions across all objects, financial fees, retainer agreements, and webhook triggers."
        >
          <Badge variant="outline" className="font-mono text-[10.5px]">
            Unrestricted Root Access
          </Badge>
        </Row>

        <Row
          label="Layer 2: Production Team (Ishan / Priya)"
          description="Row-level locked to assigned projects. Allowed to update stage progression, review links, and revision notes."
        >
          <Badge variant="outline" className="font-mono text-[10.5px]">
            Scoped Workspace Member
          </Badge>
        </Row>

        <Row
          label="Layer 3: Brand Partner (Rajesh / Atomberg)"
          description="Isolated review portal. Internal notes, raw production stages, editor names, and commercial rates remain hidden."
        >
          <Badge variant="outline" className="font-mono text-[10.5px]">
            Client Isolated Portal
          </Badge>
        </Row>
      </Section>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-950">
              Invite New Workspace Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Provision a new user account with role-scoped access controls and trigger onboarding automation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-3.5 py-1 text-xs">
            <div>
              <Label>Full Name *</Label>
              <TextInput
                value={inviteName}
                onChange={setInviteName}
                placeholder="e.g. Maya Patel"
                className="w-full"
              />
            </div>

            <div>
              <Label>Work Email Address *</Label>
              <TextInput
                type="email"
                value={inviteEmail}
                onChange={setInviteEmail}
                placeholder="e.g. maya@theboredmonkey.com"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>System Role</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
                >
                  <option value="Editor">Editor</option>
                  <option value="Creative">Creative Lead</option>
                  <option value="Manager">Production Manager</option>
                  <option value="Brand POC">Brand Partner (Client)</option>
                </select>
              </div>

              <div>
                <Label>Department</Label>
                <select
                  value={inviteDept}
                  onChange={(e) => setInviteDept(e.target.value as any)}
                  className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
                >
                  <option value="EDITOR">Editorial</option>
                  <option value="CREATIVE">Creative & Script</option>
                  <option value="PRODUCTION">Physical Shoot</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-4 pt-3 border-t border-slate-200/70">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Dispatch Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}
