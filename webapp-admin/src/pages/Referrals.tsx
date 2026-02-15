import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Referrals() {
  const { data: referrals, isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => api.getReferrals(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Рефералы</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Кто пригласил
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон пользователя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имя друга
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон друга
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals?.map((ref: any) => (
                <tr key={ref.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ref.first_name} {ref.last_name || ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {ref.telegram_id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <a href={`tel:${ref.phone}`} className="text-blue-600 hover:text-blue-800">
                      {ref.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ref.friend_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a href={`tel:${ref.friend_phone}`} className="text-blue-600 hover:text-blue-800">
                      {ref.friend_phone}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ref.created_at
                      ? formatDistanceToNow(new Date(ref.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Всего рефералов: {referrals?.length || 0}
      </div>

      {referrals && referrals.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Пока никто не пригласил друзей
        </div>
      )}
    </div>
  );
}
