import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { EditTaskDialog } from '../components/EditTaskDialog'
import { canEdit } from '../lib/permissions'

const VERIFICATION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  qr: { label: 'QR-код', color: 'bg-violet-100 text-violet-700', icon: '📱' },
  app_code: { label: 'Код приложения', color: 'bg-blue-100 text-blue-700', icon: '🔑' },
  qr_or_manual: { label: 'QR / Ручной', color: 'bg-indigo-100 text-indigo-700', icon: '📲' },
  photo: { label: 'Фото', color: 'bg-pink-100 text-pink-700', icon: '📸' },
  quiz: { label: 'Квиз', color: 'bg-amber-100 text-amber-700', icon: '🧠' },
  manual: { label: 'Ручной', color: 'bg-gray-100 text-gray-700', icon: '✏️' },
  review: { label: 'Отзыв', color: 'bg-green-100 text-green-700', icon: '⭐' },
}

const BORDER_COLORS: Record<string, string> = {
  qr: 'border-l-violet-400',
  app_code: 'border-l-blue-400',
  qr_or_manual: 'border-l-indigo-400',
  photo: 'border-l-pink-400',
  quiz: 'border-l-amber-400',
  manual: 'border-l-gray-400',
  review: 'border-l-green-400',
}

export default function Tasks() {
  const [editingTask, setEditingTask] = useState<any>(null)

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.getTasks(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Загрузка заданий...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Задания</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {tasks?.length || 0} заданий в программе
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(VERIFICATION_LABELS).map(([key, val]) => {
            const count = tasks?.filter((t: any) => t.verification_type === key).length
            if (!count) return null
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${val.color}`}>
                {val.icon} {val.label}: {count}
              </span>
            )
          })}
        </div>
      </div>

      {/* Список заданий */}
      <div className="grid gap-3">
        {tasks?.map((task: any) => {
          const vtype = task.verification_type || 'manual'
          const vinfo = VERIFICATION_LABELS[vtype] || { label: vtype, color: 'bg-gray-100 text-gray-700', icon: '❓' }
          const borderColor = BORDER_COLORS[vtype] || 'border-l-gray-300'

          return (
            <div
              key={task.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${borderColor} p-5 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Левая часть */}
                <div className="flex gap-4 flex-1 min-w-0">
                  {/* День */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                    {task.day_number}
                  </div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {task.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${vinfo.color}`}>
                        {vinfo.icon} {vinfo.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>

                    {/* Метрики */}
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🪙</span>
                        <span className="text-sm font-semibold text-gray-800">{task.coins_reward}</span>
                        <span className="text-xs text-gray-400">монет</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">✅</span>
                        <span className="text-sm font-semibold text-gray-800">{task.completion_count}</span>
                        <span className="text-xs text-gray-400">выполнений</span>
                      </div>

                      {/* Коды верификации — единый блок */}
                      {(vtype === 'qr' || vtype === 'app_code' || vtype === 'qr_or_manual') &&
                        task.verification_data && (
                          <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden text-xs font-mono">
                            {task.verification_data.test_code && (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 border-r border-gray-200">
                                <span className="text-gray-400 font-sans">🔧</span>
                                <span className="font-semibold text-violet-700">{task.verification_data.test_code}</span>
                              </div>
                            )}
                            {task.verification_data.qr_code && (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border-r border-gray-200">
                                <span className="text-gray-400 font-sans">📱</span>
                                <span className="font-semibold text-green-700">{task.verification_data.qr_code}</span>
                              </div>
                            )}
                            {task.verification_data.manual_code && (
                              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50">
                                <span className="text-gray-400 font-sans">⌨️</span>
                                <span className="font-semibold text-blue-700">{task.verification_data.manual_code}</span>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Квиз: количество вопросов */}
                      {vtype === 'quiz' && task.verification_data?.questions && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400">🧠 Вопросов:</span>
                          <span className="text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            {task.verification_data.questions.length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Кнопка редактирования */}
                {canEdit() && (
                  <button
                    onClick={() => setEditingTask(task)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    ✏️ Изменить
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}
