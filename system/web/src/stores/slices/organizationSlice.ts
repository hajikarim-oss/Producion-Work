import type { StateCreator } from 'zustand'

export interface Organization {
  id: string
  name: string
  avatar?: string
  avatar_url?: string | null
  plan?: string
  // Built-in role id or a custom role's name.
  role: string
  // Caller's effective permission bitmask in this org (custom-role aware).
  permissions?: number
}

export interface OrganizationSlice {
  organizations: Organization[]
  currentOrganization: Organization | null

  setOrganizations: (organizations: Organization[]) => void
  setCurrentOrganization: (org: Organization | null) => void
  switchOrganization: (orgId: string) => void
}

const DEFAULT_ORG: Organization = {
  id: 'org_tbm_main',
  name: 'TheBoredMonkey Workspace',
  role: 'owner',
  plan: 'enterprise',
  permissions: 4294967295,
};

export const createOrganizationSlice: StateCreator<OrganizationSlice, [], [], OrganizationSlice> = (set, get) => ({
  organizations: [DEFAULT_ORG],
  currentOrganization: DEFAULT_ORG,

  setOrganizations: (organizations) => {
    const list = organizations.length > 0 ? organizations : [DEFAULT_ORG];
    const current = get().currentOrganization;
    const fresh = current
      ? (list.find((o) => o.id === current.id) ?? list[0] ?? DEFAULT_ORG)
      : (list[0] ?? DEFAULT_ORG);
    set({
      organizations: list,
      currentOrganization: fresh,
    });
  },

  setCurrentOrganization: (currentOrganization) => set({ currentOrganization }),

  // Local-only switch. Callers MUST also POST `/organization/switch/:id`
  // (use the `useSwitchOrganization` hook) or the server session will
  // disagree with the UI. Kept for callers that have already done the
  // server round-trip and just need to advance local state.
  switchOrganization: (orgId) => {
    const org = get().organizations.find((o) => o.id === orgId)
    if (org) {
      set({ currentOrganization: org })
    }
  },
})
