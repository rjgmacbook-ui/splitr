import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { CreateGroupPage } from '@/features/groups/CreateGroupPage'
import { GroupPage } from '@/features/groups/GroupPage'
import { GroupBalancesPage } from '@/features/groups/GroupBalancesPage'
import { GroupSettingsPage } from '@/features/groups/GroupSettingsPage'
import { SettlePage } from '@/features/settle/SettlePage'
import { ExpenseDetailPage } from '@/features/expenses/ExpenseDetailPage'
import { AddExpensePage } from '@/features/expenses/AddExpensePage'
import { JoinGroupPage } from '@/features/groups/JoinGroupPage'
import { AccountPage } from '@/features/account/AccountPage'
import { GroupsListPage } from '@/features/groups/GroupsListPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/join/:token" element={<JoinGroupPage />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <AppShell>
                  <Routes>
                    <Route index element={<DashboardPage />} />
                    <Route path="groups" element={<GroupsListPage />} />
                    <Route path="groups/new" element={<CreateGroupPage />} />
                    <Route path="groups/:id" element={<GroupPage />} />
                    <Route path="groups/:id/balances" element={<GroupBalancesPage />} />
                    <Route path="groups/:id/settings" element={<GroupSettingsPage />} />
                    <Route path="groups/:id/settle" element={<SettlePage />} />
                    <Route path="expenses/new" element={<AddExpensePage />} />
                    <Route path="expenses/:id" element={<ExpenseDetailPage />} />
                    <Route path="account" element={<AccountPage />} />
                  </Routes>
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
