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
    refetchInterval: 15000,
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
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const active = purchases?.filter((p: any) => !p.is_redeemed) || []
  const redeemed = purchases?.filter((p: any) => p.is_redeemed) || []

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Покупки</h1>
      <p className="text-gray-500 mb-6 text-sm">Активных: {active.length} · Выдано: {redeemed.length}</p>

      {/* ── Ожидают выдачи ── */}
      <div className="mb-8">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3">🟡 Ожидают выдачи</h2>

        {active.length === 0 ? (
          <div className="py-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            Нет активных заказов
          </div>
        ) : (
          <>
            {/* Мобильные карточки */}
            <div className="flex flex-col gap-3 md:hidden">
              {active.map((purchase: any) => (
                <div key={purchase.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {purchase.first_name} {purchase.last_name || ''}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{purchase.item_title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true, locale: ru })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold tracking-widest text-indigo-700">{purchase.redemption_code || '—'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{purchase.price_paid} 🪙</div>
                    </div>
                  </div>
                  <button
                    onClick={() => redeemMutation.mutate(purchase.id)}
                    disabled={redeemingId === purchase.id}
                    className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {redeemingId === purchase.id ? 'Выдача...' : '✓ Выдать приз'}
                  </button>
                </div>
              ))}
            </div>

            {/* Десктопная таблица */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                          <div className="text-sm font-medium text-gray-900">{purchase.first_name} {purchase.last_name || ''}</div>
                          <div className="text-xs text-gray-500">{purchase.telegram_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.item_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-base font-bold tracking-widest text-indigo-700">{purchase.redemption_code || '—'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{purchase.price_paid} 🪙</td>
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
          </>
        )}
      </div>

      {/* ── Выданные ── */}
      {redeemed.length > 0 && (
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3">✅ Выданные</h2>

          {/* Мобильные карточки */}
          <div className="flex flex-col gap-2 md:hidden">
            {redeemed.map((purchase: any) => (
              <div key={purchase.id} className="bg-white rounded-xl border border-gray-200 p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {purchase.first_name} {purchase.last_name || ''}
                    </div>
                    <div className="text-xs text-gray-500">{purchase.item_title}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-sm text-gray-400 line-through">{purchase.redemption_code}</div>
                    <div className="text-xs text-gray-400">{purchase.price_paid} 🪙</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Десктопная таблица */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                        <div className="text-sm font-medium text-gray-900">{purchase.first_name} {purchase.last_name || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{purchase.item_title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 line-through">{purchase.redemption_code || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{purchase.price_paid} 🪙</td>
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
