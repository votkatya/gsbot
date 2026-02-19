import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, ListChecks, Gift, ShoppingCart, UserPlus, LogOut, Star } from 'lucide-react'
import { api } from '../lib/api'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const userName = localStorage.getItem('admin_name') || 'Пользователь'
  const userRole = localStorage.getItem('admin_role') || 'staff'

  // Счётчик pending отзывов для бейджа
  const { data: reviewsCount } = useQuery({
    queryKey: ['reviewsCount'],
    queryFn: () => api.getReviewsCount(),
    refetchInterval: 60000, // обновляем раз в минуту
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
    { path: '/users', icon: Users, label: 'Пользователи' },
    { path: '/tasks', icon: ListChecks, label: 'Задания' },
    { path: '/prizes', icon: Gift, label: 'Призы' },
    { path: '/purchases', icon: ShoppingCart, label: 'Покупки' },
    { path: '/referrals', icon: UserPlus, label: 'Рефералы' },
    { path: '/reviews', icon: Star, label: 'Отзывы', badge: pendingCount },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Город Спорта</h1>
          <p className="text-gray-400 text-sm mt-1">Админ-панель</p>
        </div>

        <nav className="flex-1 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
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
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="mb-3 px-4 py-2 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Вошли как:</p>
            <p className="text-white font-medium">{userName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {userRole === 'admin' ? '🔑 Администратор' : '👁️ Сотрудник (просмотр)'}
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
