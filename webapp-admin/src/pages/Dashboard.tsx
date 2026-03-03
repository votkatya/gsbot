import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Users, Camera, Gift } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Dashboard() {
  const navigate = useNavigate()

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

  const totalUsers = stats?.users?.total || 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Дашборд</h1>

      {/* Карточки */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Пользователи */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Участников</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalUsers}</div>
          <p className="text-gray-500 text-sm">Активных за 7 дней: {stats?.users?.active || 0}</p>
        </div>

        {/* Скриншоты на проверке */}
        <div
          onClick={() => navigate('/reviews')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Camera className="text-white" size={24} />
            </div>
            {(stats?.pendingReviews || 0) > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                Требует внимания
              </span>
            )}
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Скриншоты на проверке</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.pendingReviews || 0}</div>
          <p className="text-yellow-600 text-sm font-medium">Нажми чтобы проверить →</p>
        </div>

        {/* Призы к выдаче */}
        <div
          onClick={() => navigate('/purchases')}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Gift className="text-white" size={24} />
            </div>
            {(stats?.pendingPurchases || 0) > 0 && (
              <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                Требует внимания
              </span>
            )}
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Призов к выдаче</h3>
          <div className="text-3xl font-bold text-gray-900 mb-1">{stats?.pendingPurchases || 0}</div>
          <p className="text-purple-600 text-sm font-medium">Нажми чтобы выдать →</p>
        </div>
      </div>

      {/* График регистраций */}
      {chartData?.registrationsByDay && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Регистрации (последние 7 дней)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData.registrationsByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'd MMM', { locale: ru })}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(date) => format(new Date(date), 'd MMMM', { locale: ru })}
                formatter={(value: any) => [`${value} чел.`, 'Регистрации']}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Воронка заданий */}
      {chartData?.taskFunnel && chartData.taskFunnel.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Воронка заданий</h2>
          <p className="text-sm text-gray-500 mb-5">Сколько участников выполнили каждое задание</p>
          <div className="space-y-3">
            {chartData.taskFunnel.map((task: any) => {
              const pct = totalUsers > 0 ? Math.round((task.completions / totalUsers) * 100) : 0
              const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400'
              return (
                <div key={task.day} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6 text-right shrink-0">{task.day}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 truncate pr-2">{task.title}</span>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        {task.completions} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-green-500" /> ≥70%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-yellow-500" /> 40–69%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-full bg-red-400" /> &lt;40%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
