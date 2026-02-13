import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { EditPrizeDialog } from '../components/EditPrizeDialog'

export default function Prizes() {
  const [editingPrize, setEditingPrize] = useState<any>(null)

  const { data: prizes, isLoading } = useQuery({
    queryKey: ['prizes'],
    queryFn: () => api.getPrizes(),
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Призы</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes?.map((prize: any) => (
          <div
            key={prize.id}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
              prize.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {prize.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{prize.description}</p>
              </div>
              {!prize.is_active && (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                  Неактивен
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">
                  {prize.price} 🪙
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Куплено: {prize.purchase_count}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setEditingPrize(prize)}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                Редактировать
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Всего призов: {prizes?.length || 0} (активных: {prizes?.filter((p: any) => p.is_active).length || 0})
      </div>

      {editingPrize && (
        <EditPrizeDialog
          prize={editingPrize}
          isOpen={!!editingPrize}
          onClose={() => setEditingPrize(null)}
        />
      )}
    </div>
  )
}
