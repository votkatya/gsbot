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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            Экспорт в Excel
          </button>
          <div className="relative">
          <input
            type="text"
            placeholder="Поиск по имени, username, телефону..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Абонемент
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Спорткоины
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заданий
                </th>
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
                    <div className="text-sm font-medium text-gray-900">
                      {user.first_name} {user.last_name || ''}
                    </div>
                    {user.username && (
                      <div className="text-xs text-gray-400">@{user.username}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone || '—'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.membership_type === 'yes' && '✅ Да'}
                    {user.membership_type === 'trial' && '🎁 Пробная'}
                    {user.membership_type === 'no' && '❌ Нет'}
                    {!user.membership_type && '—'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.coins} 🪙
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.xp}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.completed_tasks}
                  </td>
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
