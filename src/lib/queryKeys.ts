export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    profile: ['auth', 'profile'] as const,
  },
  groups: {
    all: ['groups'] as const,
    detail: (id: string) => ['groups', id] as const,
    members: (id: string) => ['groups', id, 'members'] as const,
    balances: (id: string) => ['groups', id, 'balances'] as const,
    invites: (id: string) => ['groups', id, 'invites'] as const,
  },
  expenses: {
    byGroup: (groupId: string) => ['expenses', { groupId }] as const,
    detail: (id: string) => ['expenses', 'detail', id] as const,
  },
  profiles: {
    byIds: (ids: string[]) => ['profiles', ...ids.sort()] as const,
  },
  dashboard: {
    balances: ['dashboard', 'balances'] as const,
  },
} as const
