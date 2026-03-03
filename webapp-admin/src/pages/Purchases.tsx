import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function Purchases() {
  const queryClient = useQueryClient()
  const [redeemingId, setRedeemingId] = useState<number | null>(null)

  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.getPurchases(),
    refetchInterval: 15000, // auto-refresh every 15s
  })

  const redeemMutation = useMutation({
    mutationFn: (id: number) => api.redeemPurchase(id),
    onMutate: (id) => setRedeemingId(id),
    onSettled: () => {
      setRedeemingId(null)
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  const active = purchases?.filter((p: any) => !p.is_redeemed) || []
  const redeemed = purchases?.filter((p: any) => p.is_redeemed) || []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Покупки</h1>
      <p className="text-gray-500 mb-8">Активных: {active.length} · Выдано: {redeemed.length}</p>

      {/* Active orders */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🟡 Ожидают выдачи</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Приз</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Код</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {active.map((purchase: any) => (
                    <tr key={purchase.id} className="hover:bg-amber-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true, locale: ru })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.first_name} {purchase.last_name || ''}
                        </div>
                        <div className="text-xs text-gray-500">{purchase.telegram_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.item_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold tracking-widest text-indigo-700">
                          {purchase.redemption_code || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {purchase.price_paid} 🪙
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => redeemMutation.mutate(purchase.id)}
                          disabled={redeemingId === purchase.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {redeemingId === purchase.id ? 'Выдача...' : 'Выдать ✓'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {active.length === 0 && (
        <div className="mb-8 py-10 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
          Нет активных заказов
        </div>
      )}

      {/* Redeemed orders */}
      {redeemed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">✅ Выданные</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата покупки</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Пользователь</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Приз</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Код</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 opacity-70">
                  {redeemed.map((purchase: any) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true, locale: ru })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.first_name} {purchase.last_name || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {purchase.item_title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 line-through">
                        {purchase.redemption_code || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {purchase.price_paid} 🪙
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
