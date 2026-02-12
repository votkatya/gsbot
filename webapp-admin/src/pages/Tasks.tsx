import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function Tasks() {
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Задания</h1>

      <div className="grid gap-4">
        {tasks?.map((task: any) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    {task.day_number}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {task.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-3">{task.description}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-500">
                    Награда: <span className="font-semibold text-gray-900">{task.coins_reward} 🪙</span>
                  </span>
                  <span className="text-gray-500">
                    Тип: <span className="font-semibold text-gray-900">{task.verification_type}</span>
                  </span>
                  <span className="text-gray-500">
                    Выполнено: <span className="font-semibold text-gray-900">{task.completion_count}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Всего заданий: {tasks?.length || 0}
      </div>
    </div>
  )
}
