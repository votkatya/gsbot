import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'

export default function Users() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  })

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users?.filter((user: any) => {
    const query = searchQuery.toLowerCase()
    return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.phone?.includes(query) ||
      user.telegram_id?.toString().includes(query) ||
      user.vk_id?.toString().includes(query)
    )
  })

  // Функция экспорта в Excel
  const handleExportToExcel = () => {
    if (!users || users.length === 0) return

    // Подготовка данных для экспорта
    const exportData = users.map((user: any) => {
      // Парсинг survey_data
      let surveyData: any = {}
      try {
        surveyData = typeof user.survey_data === 'string'
          ? JSON.parse(user.survey_data)
          : user.survey_data || {}
      } catch (e) {
        surveyData = {}
      }

      // Process goals (it's an array)
      const goalsText = Array.isArray(surveyData.goals)
        ? surveyData.goals.join(', ')
        : surveyData.goals || ''

      // Process hasKids
      let hasKidsText = ''
      if (surveyData.hasKids === 'Да' || surveyData.hasKids === 'yes' || surveyData.hasKids === true) {
        hasKidsText = 'Да'
      } else if (surveyData.hasKids === 'Нет' || surveyData.hasKids === 'no' || surveyData.hasKids === false) {
        hasKidsText = 'Нет'
      }

      // Process hasCar
      let hasCarText = ''
      if (surveyData.hasCar === 'Да' || surveyData.hasCar === true) {
        hasCarText = 'Да'
      } else if (surveyData.hasCar === 'Нет' || surveyData.hasCar === false) {
        hasCarText = 'Нет'
      }

      return {
        'ID': user.id,
        'Telegram ID': user.telegram_id || '',
        'VK ID': user.vk_id || '',
        'Имя': user.first_name || '',
        'Фамилия': user.last_name || '',
        'Username': user.username || '',
        'Телефон': user.phone || '',
        'Абонемент': user.membership_type || '',
        'Спорткоины': user.coins || 0,
        'XP': user.xp || 0,
        'Уровень': user.level || 0,
        'Заданий выполнено': user.completed_tasks || 0,
        'Полное имя (анкета)': surveyData.fullName || '',
        'Дата рождения': surveyData.birthDate || '',
        'Цели': goalsText,
        'Есть дети': hasKidsText,
        'Есть автомобиль': hasCarText,
        'Дата регистрации': user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : '',
        'Последняя активность': user.last_activity_at ? new Date(user.last_activity_at).toLocaleDateString('ru-RU') : '',
      }
    })

    // Создание Excel файла
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Участники')

    // Скачивание файла
    const fileName = `участники_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Пользователи</h1>
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download size={16} />
            Экспорт в Excel
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск по имени, username, телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Мобильные карточки */}
      <div className="flex flex-col gap-2 md:hidden">
        {filteredUsers?.map((user: any) => (
          <div
            key={user.id}
            onClick={() => navigate(`/users/${user.id}`)}
            className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-blue-50 transition-colors active:bg-blue-100"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name || ''}
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-2">
                  {user.username && <span>@{user.username}</span>}
                  {user.phone && <span>{user.phone}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-gray-800">{user.coins} 🪙</div>
                <div className="text-xs text-gray-400">{user.completed_tasks} заданий</div>
              </div>
            </div>
            {user.membership_type && (
              <div className="mt-2 text-xs">
                {user.membership_type === 'yes' && <span className="text-green-600">✅ Абонемент</span>}
                {user.membership_type === 'trial' && <span className="text-amber-600">🎁 Пробная</span>}
                {user.membership_type === 'no' && <span className="text-red-500">❌ Нет абонемента</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Десктопная таблица */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Телефон</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Абонемент</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Спорткоины</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">XP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заданий</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers?.map((user: any) => (
              <tr
                key={user.id}
                onClick={() => navigate(`/users/${user.id}`)}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name || ''}</div>
                  {user.username && <div className="text-xs text-gray-400">@{user.username}</div>}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone || '—'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.membership_type === 'yes' && '✅ Да'}
                  {user.membership_type === 'trial' && '🎁 Пробная'}
                  {user.membership_type === 'no' && '❌ Нет'}
                  {!user.membership_type && '—'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.coins} 🪙</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.xp}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{user.completed_tasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {searchQuery ? (
          <>
            Найдено: {filteredUsers?.length || 0} из {users?.length || 0}
          </>
        ) : (
          <>Всего пользователей: {users?.length || 0}</>
        )}
      </div>
    </div>
  )
}
