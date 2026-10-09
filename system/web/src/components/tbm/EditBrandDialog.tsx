import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { TextInput, NumberInput, Label } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useTBMStore } from '@/lib/tbm/tbmStore';
import type { Brand } from '@/lib/tbm/types';
import toast from 'react-hot-toast';

interface EditBrandDialogProps {
  brand: Brand | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBrandDialog({ brand, isOpen, onClose }: EditBrandDialogProps) {
  const updateBrand = useTBMStore((s) => s.updateBrand);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [name, setName] = React.useState('');
  const [tier, setTier] = React.useState('');
  const [monthlyRetainer, setMonthlyRetainer] = React.useState(150000);
  const [deliverableQuota, setDeliverableQuota] = React.useState(8);
  const [pocName, setPocName] = React.useState('');
  const [pocEmail, setPocEmail] = React.useState('');
  const [pocPhone, setPocPhone] = React.useState('');
  const [primaryColor, setPrimaryColor] = React.useState('#6366F1');

  React.useEffect(() => {
    if (brand) {
      setName(brand.name || '');
      setTier(brand.tier || 'Growth Retainer (8 Reels/mo)');
      setMonthlyRetainer(brand.monthlyRetainer || 150000);
      setDeliverableQuota(brand.deliverableQuota || 8);
      setPocName(brand.pocName || '');
      setPocEmail(brand.pocEmail || '');
      setPocPhone(brand.pocPhone || '');
      setPrimaryColor(brand.primaryColor || '#6366F1');
    }
  }, [brand]);

  if (!brand) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can modify brand retainers');
      return;
    }

    updateBrand(brand.id, {
      name: name.trim() || brand.name,
      tier,
      monthlyRetainer: Number(monthlyRetainer) || 0,
      deliverableQuota: Number(deliverableQuota) || 8,
      pocName: pocName.trim(),
      pocEmail: pocEmail.trim(),
      pocPhone: pocPhone.trim(),
      primaryColor,
    });

    toast.success(`Brand retainer "${brand.name}" updated successfully!`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-950">
            Edit Brand Retainer: {brand.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update contract tier, monthly quotas, billing value, and client communication POC.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs py-1">
          <div>
            <Label>Brand Name</Label>
            <TextInput
              required
              value={name}
              onChange={setName}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contract Tier</Label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="h-7 px-2.5 rounded-md border border-slate-200 bg-white text-[12.5px] text-slate-900 focus:border-slate-800 focus:ring-2 focus:ring-[#FFE600]/30 w-full"
              >
                <option value="Growth Retainer (8 Reels/mo)">Growth (8 Reels/mo)</option>
                <option value="Scale Retainer (15 Reels/mo)">Scale (15 Reels/mo)</option>
                <option value="Enterprise (25+ Reels/mo)">Enterprise (25+ Reels/mo)</option>
                <option value="Project-Based Pilot">Project-Based Pilot</option>
              </select>
            </div>

            <div>
              <Label>Monthly Quota (Reels)</Label>
              <NumberInput
                min={1}
                max={100}
                value={deliverableQuota}
                onChange={setDeliverableQuota}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Retainer Fee (₹)</Label>
              <NumberInput
                min={0}
                max={5000000}
                step={10000}
                value={monthlyRetainer}
                onChange={setMonthlyRetainer}
                className="w-full"
              />
            </div>

            <div>
              <Label>Brand Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-7 w-9 p-0 border border-slate-200 rounded cursor-pointer"
                />
                <span className="font-mono text-[11px] text-slate-500">{primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/70">
            <span className="text-[11px] font-bold text-slate-900 block mb-2">
              Primary Client POC (Review Portal User)
            </span>
            <div className="space-y-2">
              <div>
                <Label>Contact Person Name</Label>
                <TextInput
                  value={pocName}
                  onChange={setPocName}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>POC Email</Label>
                  <TextInput
                    type="email"
                    required
                    value={pocEmail}
                    onChange={setPocEmail}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label>POC Phone (WhatsApp)</Label>
                  <TextInput
                    type="tel"
                    value={pocPhone}
                    onChange={setPocPhone}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
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
              Save Retainer Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
