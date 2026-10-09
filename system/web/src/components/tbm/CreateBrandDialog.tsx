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
import toast from 'react-hot-toast';

interface CreateBrandDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBrandDialog({ isOpen, onClose }: CreateBrandDialogProps) {
  const addBrand = useTBMStore((s) => s.addBrand);
  const activeRole = useTBMStore((s) => s.activeRole);

  const [name, setName] = React.useState('');
  const [tier, setTier] = React.useState('Growth Retainer (8 Reels/mo)');
  const [monthlyRetainer, setMonthlyRetainer] = React.useState(150000);
  const [deliverableQuota, setDeliverableQuota] = React.useState(8);
  const [pocName, setPocName] = React.useState('');
  const [pocEmail, setPocEmail] = React.useState('');
  const [pocPhone, setPocPhone] = React.useState('');
  const [primaryColor, setPrimaryColor] = React.useState('#6366F1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole !== 'ADMIN') {
      toast.error('Only Sachin (Master Admin) can onboard new client retainers');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter brand name');
      return;
    }
    if (!pocEmail.trim()) {
      toast.error('Please enter client POC email');
      return;
    }

    addBrand({
      name: name.trim(),
      tier,
      monthlyRetainer: Number(monthlyRetainer) || 0,
      deliverableQuota: Number(deliverableQuota) || 8,
      pocName: pocName.trim() || 'Client Partner',
      pocEmail: pocEmail.trim(),
      pocPhone: pocPhone.trim(),
      primaryColor,
      secondaryColor: '#F3F4F6',
      status: 'ACTIVE',
    });

    toast.success(`🎉 Brand Retainer "${name.trim()}" onboarded! Portal credentials generated.`);
    setName('');
    setPocName('');
    setPocEmail('');
    setPocPhone('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-950">
            Onboard New Client Brand & Retainer
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Register client entity, billing quota, and primary POC review access for Layer 3 portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs py-1">
          <div>
            <Label>Brand / Company Name *</Label>
            <TextInput
              required
              placeholder="e.g. Zepto, Atomberg, Ultrahuman"
              value={name}
              onChange={setName}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Retainer Tier</Label>
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
              <Label>Monthly Fee (₹)</Label>
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
                  placeholder="e.g. Rajesh Sharma"
                  value={pocName}
                  onChange={setPocName}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>POC Email *</Label>
                  <TextInput
                    type="email"
                    required
                    placeholder="poc@brand.com"
                    value={pocEmail}
                    onChange={setPocEmail}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label>POC Phone (WhatsApp)</Label>
                  <TextInput
                    type="tel"
                    placeholder="+91 98765 43210"
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
              Onboard Retainer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
