import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, ListChecks, Gift, ShoppingCart, UserPlus, LogOut, Star, Menu, X } from 'lucide-react'
import { api } from '../lib/api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const userName = localStorage.getItem('admin_name') || 'Пользователь'
  const userRole = localStorage.getItem('admin_role') || 'staff'

  const { data: reviewsCount } = useQuery({
    queryKey: ['reviewsCount'],
    queryFn: () => api.getReviewsCount(),
    refetchInterval: 60000,
  })
  const pendingCount = reviewsCount?.count || 0

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_role')
    localStorage.removeItem('admin_name')
    navigate('/')
  }

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/reviews', icon: Star, label: 'Отзывы', badge: pendingCount },
    { path: '/purchases', icon: ShoppingCart, label: 'Покупки' },
    { path: '/users', icon: Users, label: 'Пользователи' },
    { path: '/tasks', icon: ListChecks, label: 'Задания' },
    { path: '/prizes', icon: Gift, label: 'Призы' },
    { path: '/referrals', icon: UserPlus, label: 'Рефералы' },
  ]

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon size={20} />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-orange-500 text-white rounded-full">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Город Спорта</h1>
          <p className="text-gray-400 text-sm mt-1">Админ-панель</p>
        </div>
        <nav className="flex-1 px-4">
          <NavLinks />
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4 py-2 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Вошли как:</p>
            <p className="text-white font-medium">{userName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {userRole === 'admin' ? '🔑 Администратор' : '👁️ Сотрудник'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white flex items-center justify-between px-4 h-14 shadow-lg">
        <h1 className="text-lg font-bold">Город Спорта</h1>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold bg-orange-500 text-white rounded-full">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Меню"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* ── Mobile Slide-in Menu ── */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-gray-900 text-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <h1 className="text-lg font-bold">Город Спорта</h1>
                <p className="text-gray-400 text-xs">{userRole === 'admin' ? '🔑 Администратор' : '👁️ Сотрудник'}</p>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X size={22} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-3 overflow-y-auto">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </nav>
            <div className="p-4 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
              >
                <LogOut size={20} />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-4 md:p-8 pt-[72px] md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
