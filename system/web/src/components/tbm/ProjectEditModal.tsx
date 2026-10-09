import React from 'react';
import type { Project } from '@/lib/tbm/types';
import {
  EditStatus,
  ProjectStage,
  RevisionRound,
  VALID_STAGE_TRANSITIONS,
} from '@/lib/tbm/types';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import toast from 'react-hot-toast';
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
import { ShieldAlert } from 'lucide-react';

interface ProjectEditModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectEditModal({
  project,
  isOpen,
  onClose,
}: ProjectEditModalProps) {
  const updateProject = useTBMStore((s) => s.updateProject);
  const members = useTBMStore((s) => s.members);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [title, setTitle] = React.useState('');
  const [currentStage, setCurrentStage] = React.useState<ProjectStage>(
    ProjectStage.BRIEF_RECEIVED,
  );
  const [editStatus, setEditStatus] = React.useState<EditStatus>(
    EditStatus.EDIT_IN_PROGRESS,
  );
  const [revisionRound, setRevisionRound] = React.useState<RevisionRound>(
    RevisionRound.R0,
  );
  const [assignedToId, setAssignedToId] = React.useState('');
  const [deadline, setDeadline] = React.useState('');
  const [reviewUrl, setReviewUrl] = React.useState('');
  const [internalNotes, setInternalNotes] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (project) {
      setTitle(project.title);
      setCurrentStage(project.currentStage);
      setEditStatus(project.editStatus || EditStatus.EDIT_IN_PROGRESS);
      setRevisionRound(project.revisionRound || RevisionRound.R0);
      setAssignedToId(project.assignedToId || '');
      setDeadline(project.deadline || '');
      setReviewUrl(project.reviewUrl || '');
      setInternalNotes(project.internalNotes || '');
      setNotes(project.notes || '');
    }
  }, [project]);

  if (!project) return null;

  const isTeamRole = activeRole === 'EDITOR' || activeRole === 'CREATIVE';
  const isBrandPOC = activeRole === 'BRAND_POC';
  const allowedNextStages = VALID_STAGE_TRANSITIONS[project.currentStage] || [];

  const handleSave = () => {
    const patch: Partial<Project> = {
      editStatus,
      revisionRound,
      internalNotes,
      reviewUrl,
      notes,
    };

    if (!isTeamRole && !isBrandPOC) {
      patch.title = title;
      patch.currentStage = currentStage;
      patch.deadline = deadline;
      if (assignedToId) {
        const mem = members.find((m) => m.id === assignedToId);
        if (mem) {
          patch.assignedToId = mem.id;
          patch.assigneeName = mem.name;
          patch.assigneeEmail = mem.email;
          patch.department = mem.department;
        }
      }
    }

    const result = updateProject(project.id, patch);
    if (!result.success) {
      toast.error(result.error || 'Failed to update deliverable');
      return;
    }

    toast.success(`Updated "${project.title}"`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
              {project.brandName}
            </span>
            <span className="text-[10px] font-mono text-slate-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/60">
              {project.contentType}
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-slate-950 mt-1">
            {project.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Assigned to: <strong className="text-slate-900">{project.assignedToName || 'Unassigned'}</strong>
          </DialogDescription>
        </DialogHeader>

        {isTeamRole && (
          <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>{activeRole === 'CREATIVE' ? 'Creative Lead' : 'Editor'} Role (Layer 2 Permissions):</strong> You have edit access for{' '}
              <em>Edit Status</em>, <em>Revision Round</em>, <em>Review Link</em>, and <em>Notes</em>. Core title, stage machine, and deadlines are managed by Admin.
            </div>
          </div>
        )}

        <div className="space-y-3.5 text-xs py-1">
          <div>
            <Label>Deliverable Title</Label>
            <TextInput
              disabled={isTeamRole || isBrandPOC}
              value={title}
              onChange={setTitle}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assigned Team Member</Label>
              <select
                disabled={isTeamRole || isBrandPOC}
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>SLA Target Deadline</Label>
              <input
                type="date"
                disabled={isTeamRole || isBrandPOC}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pipeline Stage (22 Stages)</Label>
              <select
                disabled={isTeamRole || isBrandPOC}
                value={currentStage}
                onChange={(e) =>
                  setCurrentStage(e.target.value as ProjectStage)
                }
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value={project.currentStage}>
                  {project.currentStage.replace(/_/g, ' ')} (Current)
                </option>
                {allowedNextStages.map((st) => (
                  <option key={st} value={st}>
                    ➔ {st.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              {allowedNextStages.length > 0 && !isTeamRole && (
                <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                  Valid transitions: {allowedNextStages.map((s) => s.replace(/_/g, ' ')).join(', ')}
                </div>
              )}
            </div>

            <div>
              <Label>Edit Status</Label>
              <select
                disabled={isBrandPOC}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as EditStatus)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value={EditStatus.EDIT_IN_PROGRESS}>
                  Edit in progress
                </option>
                <option value={EditStatus.FIRST_CUT_READY}>
                  First cut ready
                </option>
                <option value={EditStatus.FIRST_CUT_SENT}>First cut sent</option>
                <option value={EditStatus.REVISING}>Revising</option>
                <option value={EditStatus.FINAL}>Final</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Revision Round</Label>
            <select
              disabled={isBrandPOC}
              value={revisionRound}
              onChange={(e) =>
                setRevisionRound(e.target.value as RevisionRound)
              }
              className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
            >
              <option value={RevisionRound.R0}>R0 (Original cut)</option>
              <option value={RevisionRound.R1}>R1 (1st round)</option>
              <option value={RevisionRound.R2}>R2 (2nd round)</option>
              <option value={RevisionRound.R3}>
                R3 ⚠️ (Auto-escalation to Sachin)
              </option>
              <option value={RevisionRound.R4_PLUS}>R4+ (Extended)</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="mb-0">
                Cut Review Video Link (Frame.io / Vimeo / YouTube / Drive)
              </Label>
              {reviewUrl && (
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Test Player ↗
                </a>
              )}
            </div>
            <TextInput
              type="url"
              disabled={isBrandPOC}
              value={reviewUrl}
              onChange={setReviewUrl}
              placeholder="https://review.frame.io/v/cut-preview"
              className="w-full"
            />
          </div>

          <div>
            <Label>Internal Production Notes</Label>
            <textarea
              rows={2}
              disabled={isBrandPOC}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white p-2 text-[12.5px] text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 outline-none"
              placeholder="Internal edit notes, client brief specifics, asset drive paths..."
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-3 border-t border-slate-200/70">
          <div className="text-[11px] text-slate-500">
            Client Status:{' '}
            <span className="font-semibold text-slate-900">
              {project.clientStatus}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleSave} className="font-semibold">
              Save & Apply Rules
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
