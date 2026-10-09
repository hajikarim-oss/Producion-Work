import React from 'react';
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
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Project } from '@/lib/tbm/types';
import toast from 'react-hot-toast';

interface ExtendSLADialogProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExtendSLADialog({ project, isOpen, onClose }: ExtendSLADialogProps) {
  const extendSLA = useTBMStore((s) => s.extendSLA);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [extensionDays, setExtensionDays] = React.useState('2');
  const [reason, setReason] = React.useState('Client asset delivery delay');

  if (!project) return null;

  const currentDue = project.deadline ? new Date(project.deadline) : new Date();
  const proposedDate = new Date(currentDue);
  proposedDate.setDate(proposedDate.getDate() + (Number(extensionDays) || 2));
  const proposedDateStr = proposedDate.toISOString().split('T')[0];

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can grant SLA extensions');
      return;
    }

    extendSLA(project.id, proposedDateStr, reason.trim() || 'Admin extension');
    toast.success(`SLA for "${project.title}" extended to ${proposedDateStr}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-950">
            Grant SLA Extension
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Recompute turnaround target and log justification in production audit trail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-3.5 text-xs py-1">
          <div className="p-2.5 rounded-md bg-stone-50 border border-slate-200">
            <span className="text-[12px] font-semibold text-slate-900 block">
              {project.title}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Current Deadline: <strong className="text-slate-700 font-mono">{project.deadline || 'None'}</strong> • Brand: {project.brandName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Extension Window</Label>
              <select
                value={extensionDays}
                onChange={(e) => setExtensionDays(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value="1">+1 Business Day</option>
                <option value="2">+2 Days (Standard)</option>
                <option value="3">+3 Days</option>
                <option value="5">+5 Days (Reshoot/Major)</option>
                <option value="7">+1 Week</option>
              </select>
            </div>

            <div>
              <Label>New Target Delivery</Label>
              <div className="h-7 px-2.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 font-mono font-semibold text-[12.5px] flex items-center">
                {proposedDateStr}
              </div>
            </div>
          </div>

          <div>
            <Label>Extension Justification</Label>
            <TextInput
              required
              value={reason}
              onChange={setReason}
              placeholder="Provide reason for audit logging..."
              className="w-full"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-200/70">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="font-semibold"
            >
              Grant Extension
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
