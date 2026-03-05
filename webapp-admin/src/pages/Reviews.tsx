import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'
import { canManageReviews } from '../lib/permissions'

const API_BASE = 'https://gsbot18.ru'

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'all'

export default function Reviews() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>('pending')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', statusFilter],
    queryFn: () => api.getReviews(statusFilter),
    refetchInterval: 30000, // обновляем каждые 30 сек
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviewsCount'] })
      toast.success('Отзыв одобрен! Монеты начислены.')
    },
    onError: (e: any) => toast.error(`Ошибка: ${e.message}`),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      api.rejectReview(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['reviewsCount'] })
      setRejectingId(null)
      setRejectComment('')
      toast.success('Отзыв отклонён.')
    },
    onError: (e: any) => toast.error(`Ошибка: ${e.message}`),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  const statusTabs: { value: ReviewStatus; label: string }[] = [
    { value: 'pending', label: '⏳ На проверке' },
    { value: 'approved', label: '✅ Одобренные' },
    { value: 'rejected', label: '❌ Отклонённые' },
    { value: 'all', label: '📋 Все' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Проверка отзывов</h1>
        {reviews && statusFilter === 'pending' && reviews.length > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
            {reviews.length} ожидают проверки
          </span>
        )}
      </div>

      {/* Фильтр по статусу */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Список заявок */}
      {reviews?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">
            {statusFilter === 'pending'
              ? '🎉 Нет заявок на проверку'
              : 'Заявок не найдено'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews?.map((review: any) => (
            <div
              key={review.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              {/* Скриншот + инфо: на мобильном — столбиком, на десктопе — рядом */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Скриншот */}
                <div className="flex-shrink-0 flex sm:flex-col items-center gap-3 sm:gap-1">
                  <img
                    src={`${API_BASE}${review.photo_url}`}
                    alt="Скриншот отзыва"
                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setLightboxUrl(`${API_BASE}${review.photo_url}`)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect fill="%23f3f4f6" width="128" height="128"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">Фото</text></svg>'
                    }}
                  />
                  <p className="text-xs text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setLightboxUrl(`${API_BASE}${review.photo_url}`)}>
                    Увеличить
                  </p>
                </div>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {review.first_name} {review.last_name || ''}
                        </span>
                        <span className="text-sm text-gray-400">
                          TG: {review.telegram_id}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        📋 <span className="font-medium">{review.task_title}</span>
                      </div>
                      <div className="text-sm text-gray-500 mb-3">
                        🪙 Награда: <span className="font-semibold text-gray-900">{review.coins_reward}</span>
                        {' · '}
                        🕒 {formatDistanceToNow(new Date(review.submitted_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </div>

                      {/* Статус */}
                      {review.status === 'approved' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Одобрен · {review.reviewed_by}
                        </span>
                      )}
                      {review.status === 'rejected' && (
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ❌ Отклонён · {review.reviewed_by}
                          </span>
                          {review.admin_comment && (
                            <p className="text-xs text-gray-500 mt-1">
                              Причина: {review.admin_comment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Кнопки действий */}
                    {canManageReviews() && review.status === 'pending' && (
                      <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                        <button
                          onClick={() => approveMutation.mutate(review.id)}
                          disabled={approveMutation.isPending}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          ✅ Одобрить
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(review.id)
                            setRejectComment('')
                          }}
                          disabled={rejectMutation.isPending}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          ❌ Отклонить
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Форма отклонения */}
                  {rejectingId === review.id && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Причина отклонения (будет отправлена пользователю):
                      </label>
                      <input
                        type="text"
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        placeholder="Например: скриншот нечитаем, отзыв не найден..."
                        className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            rejectMutation.mutate({ id: review.id, comment: rejectComment })
                          }
                          disabled={rejectMutation.isPending}
                          className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          {rejectMutation.isPending ? 'Отклонение...' : 'Подтвердить'}
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        Показано: {reviews?.length || 0}
      </div>

      {/* Lightbox для просмотра фото */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <img
              src={lightboxUrl}
              alt="Скриншот отзыва (полный размер)"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors"
            >
              ×
            </button>
            <p className="text-center text-white/60 text-sm mt-2">
              Нажмите вне фото чтобы закрыть
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
