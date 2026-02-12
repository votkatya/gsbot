import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Users, ListChecks, Gift, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  const cards = [
    {
      title: 'Всего пользователей',
      value: stats?.users.total || 0,
      subtitle: `Активных: ${stats?.users.active || 0}`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Заданий выполнено',
      value: stats?.tasks.completed || 0,
      subtitle: `Всего заданий: ${stats?.tasks.total || 0}`,
      icon: ListChecks,
      color: 'bg-green-500',
    },
    {
      title: 'Призов куплено',
      value: stats?.prizes.purchased || 0,
      subtitle: `Доступно призов: ${stats?.prizes.total || 0}`,
      icon: Gift,
      color: 'bg-purple-500',
    },
    {
      title: 'Спортиков потрачено',
      value: stats?.prizes.coinsSpent || 0,
      subtitle: 'За всё время',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Дашборд</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">
                {card.title}
              </h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {card.value.toLocaleString()}
              </div>
              <p className="text-gray-500 text-sm">{card.subtitle}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Добро пожаловать в админ-панель!
        </h2>
        <p className="text-gray-600 mb-4">
          Здесь вы можете управлять пользователями, заданиями и призами.
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>• Просматривайте статистику по пользователям и активности</li>
          <li>• Управляйте заданиями и настраивайте награды</li>
          <li>• Контролируйте призы и историю покупок</li>
          <li>• Следите за активностью пользователей</li>
        </ul>
      </div>
    </div>
  )
}
