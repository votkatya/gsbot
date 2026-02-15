import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import UserDetails from './pages/UserDetails'
import Tasks from './pages/Tasks'
import Prizes from './pages/Prizes'
import Purchases from './pages/Purchases'
import Referrals from './pages/Referrals'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  return token ? <>{children}</> : <Navigate to="/" replace />
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/users/:id" element={<UserDetails />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/prizes" element={<Prizes />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/referrals" element={<Referrals />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
