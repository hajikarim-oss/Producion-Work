import React from 'react';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import {
  ContentType,
  ProjectStage,
  RevisionRound,
  Priority,
} from '@/lib/tbm/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TextInput, Label } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBrandId?: string;
}

export function CreateProjectDialog({
  isOpen,
  onClose,
  defaultBrandId,
}: CreateProjectDialogProps) {
  const brands = useTBMStore((s) => s.brands);
  const members = useTBMStore((s) => s.members);
  const addProject = useTBMStore((s) => s.addProject);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [title, setTitle] = React.useState('');
  const [brandId, setBrandId] = React.useState(defaultBrandId || brands[0]?.id || '');
  const [contentType, setContentType] = React.useState<ContentType>(ContentType.REEL);
  const [assignedToId, setAssignedToId] = React.useState(members[1]?.id || members[0]?.id || '');
  const [department, setDepartment] = React.useState<'CREATIVE' | 'EDITOR' | 'PRODUCTION'>('EDITOR');
  const [priority, setPriority] = React.useState<Priority>(Priority.MEDIUM);
  const [deadline, setDeadline] = React.useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  );
  const [internalNotes, setInternalNotes] = React.useState('');

  React.useEffect(() => {
    if (defaultBrandId) {
      setBrandId(defaultBrandId);
    } else if (!brandId && brands.length > 0) {
      setBrandId(brands[0].id);
    }
  }, [defaultBrandId, brands]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can initialize new deliverables');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a deliverable title');
      return;
    }

    const selectedBrand = brands.find((b) => b.id === brandId) || brands[0];
    const selectedMember = members.find((m) => m.id === assignedToId) || members[0];

    addProject({
      title: title.trim(),
      brandId: selectedBrand.id,
      brandName: selectedBrand.name,
      contentType,
      currentStage: ProjectStage.BRIEF_RECEIVED,
      revisionRound: RevisionRound.R0,
      assignedToId: selectedMember.id,
      assignedToName: selectedMember.name,
      department,
      priority,
      deadline,
      targetDelivery: deadline,
      internalNotes: internalNotes.trim() || `Brief received for ${selectedBrand.name}`,
      isClientVisible: true,
    });

    toast.success(`🎉 Created deliverable "${title.trim()}" for ${selectedBrand.name}`);
    setTitle('');
    setInternalNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700 font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
              Layer 1 Admin Action
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              22-Stage Workflow
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-950 mt-1">
            Create Content Deliverable
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Initialize a new client production project. Enforces state machine transitions from Brief Received to Delivery.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 py-1 text-xs">
          <div>
            <Label>Deliverable Title *</Label>
            <TextInput
              value={title}
              onChange={setTitle}
              placeholder="e.g. Atomberg Mixer Grinder 30s Hook Reel"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Client Brand (Relation) *</Label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.tier || 'Retainer'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Content Type *</Label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value={ContentType.REEL}>Reel (Vertical 9:16)</option>
                <option value={ContentType.VIDEO}>Video (Horizontal 16:9)</option>
                <option value={ContentType.CAROUSEL}>Carousel (Multi-slide)</option>
                <option value={ContentType.STATIC}>Static Graphic</option>
                <option value={ContentType.STORY}>Story (Ephemeral)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assigned Team Member *</Label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                {members.filter((m) => m.department !== 'CLIENT').map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Department</Label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value="EDITOR">Editor (Blue)</option>
                <option value="CREATIVE">Creative (Purple)</option>
                <option value="PRODUCTION">Production (Green)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value={Priority.HIGH}>🔥 High</option>
                <option value={Priority.MEDIUM}>⚡ Medium</option>
                <option value={Priority.LOW}>🌱 Low</option>
              </select>
            </div>

            <div>
              <Label>SLA Due Date *</Label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
                required
              />
            </div>
          </div>

          <div>
            <Label>Internal Brief & Production Notes</Label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Script hook angle, key call-to-actions, reference drive links..."
              className="w-full rounded-md border border-slate-200 bg-white p-2 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 outline-none"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/70">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm" className="gap-1.5 font-semibold">
              <Plus className="w-3.5 h-3.5" />
              Initialize Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
