import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Users, ListChecks, Gift, TrendingUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
  })

  const { data: chartData } = useQuery({
    queryKey: ['chartStats'],
    queryFn: () => api.getChartStats(),
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

      {/* Графики */}
      {chartData && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* График регистраций */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Регистрации (последние 7 дней)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.registrationsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: ru })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'd MMMM', { locale: ru })}
                  formatter={(value: any) => [`${value} чел.`, 'Регистрации']}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* График выполнений заданий */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Выполнено заданий (последние 7 дней)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.taskCompletionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: ru })}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(date) => format(new Date(date), 'd MMMM', { locale: ru })}
                  formatter={(value: any) => [`${value} шт.`, 'Заданий']}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Топ заданий */}
      {chartData && chartData.topTasks.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Топ-5 самых популярных заданий
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.topTasks} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="title"
                type="category"
                width={200}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: any) => [`${value} раз`, 'Выполнено']} />
              <Bar dataKey="completions" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
