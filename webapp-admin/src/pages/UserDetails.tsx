import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { EditUserDialog } from '@/components/EditUserDialog';
import { toast } from 'sonner';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  });

  const user = userData?.user;
  const userTasks = userData?.tasks;
  const userPurchases = userData?.purchases;

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteUser(id!),
    onSuccess: () => {
      toast.success('Пользователь удалён');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (error: any) => {
      toast.error(`Ошибка удаления: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000); // Сброс через 5 секунд
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Пользователь не найден</p>
        <button
          onClick={() => navigate('/users')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
        >
          ← Назад к списку пользователей
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-gray-500 mt-1">
              {user.username ? `@${user.username}` : 'Нет username'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEditDialog(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showDeleteConfirm
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-red-600 hover:bg-red-50'
              } ${deleteMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {deleteMutation.isPending
                ? 'Удаление...'
                : showDeleteConfirm
                ? 'Точно удалить?'
                : 'Удалить'}
            </button>
          </div>
        </div>
      </div>

      {/* Основная информация */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Telegram ID</div>
          <div className="text-2xl font-bold text-gray-900">{user.telegram_id}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Спортики</div>
          <div className="text-2xl font-bold text-blue-600">{user.coins} 🪙</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Опыт (XP)</div>
          <div className="text-2xl font-bold text-green-600">{user.xp}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">Выполнено заданий</div>
          <div className="text-2xl font-bold text-purple-600">{user.completed_tasks}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Информация о пользователе */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Информация</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Телефон:</span>
              <span className="font-medium">{user.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Абонемент:</span>
              <span className="font-medium">
                {user.membership_type === 'yes' && '✅ Да'}
                {user.membership_type === 'trial' && '🎁 Пробная неделя'}
                {user.membership_type === 'no' && '❌ Нет'}
                {!user.membership_type && '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Регистрация:</span>
              <span className="font-medium">
                {user.created_at
                  ? formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                      locale: ru,
                    })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Последняя активность:</span>
              <span className="font-medium">
                {user.last_activity_at
                  ? formatDistanceToNow(new Date(user.last_activity_at), {
                      addSuffix: true,
                      locale: ru,
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Статистика</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Всего потрачено:</span>
              <span className="font-medium">
                {userPurchases?.reduce((sum: number, p: any) => sum + p.price, 0) || 0} 🪙
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Покупок сделано:</span>
              <span className="font-medium">{userPurchases?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Заданий выполнено:</span>
              <span className="font-medium">{userTasks?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Заработано спортиков:</span>
              <span className="font-medium">
                {userTasks?.reduce((sum: number, t: any) => sum + (t.coins_reward || 0), 0) || 0} 🪙
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Данные анкеты */}
      {user.survey_data && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Данные анкеты</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(() => {
              try {
                const survey = typeof user.survey_data === 'string'
                  ? JSON.parse(user.survey_data)
                  : user.survey_data;

                return (
                  <>
                    {survey.fullName && (
                      <div>
                        <span className="text-gray-600 text-sm">Полное имя:</span>
                        <p className="font-medium">{survey.fullName}</p>
                      </div>
                    )}
                    {survey.birthDate && (
                      <div>
                        <span className="text-gray-600 text-sm">Дата рождения:</span>
                        <p className="font-medium">{survey.birthDate}</p>
                      </div>
                    )}
                    {survey.goals && (
                      <div className="md:col-span-2">
                        <span className="text-gray-600 text-sm">Цели:</span>
                        <p className="font-medium">{survey.goals}</p>
                      </div>
                    )}
                    {survey.hasKids !== undefined && (
                      <div>
                        <span className="text-gray-600 text-sm">Есть дети:</span>
                        <p className="font-medium">{survey.hasKids ? 'Да' : 'Нет'}</p>
                      </div>
                    )}
                  </>
                );
              } catch (e) {
                return <p className="text-gray-500">Ошибка загрузки данных анкеты</p>;
              }
            })()}
          </div>
        </div>
      )}

      {/* История заданий */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">История выполненных заданий</h2>
        {userTasks && userTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    День
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Задание
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Награда
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Выполнено
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userTasks.map((task: any) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      День {task.day_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{task.task_title}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {task.coins_reward} 🪙
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(task.completed_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Пользователь ещё не выполнил ни одного задания</p>
        )}
      </div>

      {/* История покупок */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4">История покупок</h2>
        {userPurchases && userPurchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Приз
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Цена
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Дата покупки
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userPurchases.map((purchase: any) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{purchase.item_title}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{purchase.price} 🪙</td>
                    <td className="px-4 py-3 text-sm">
                      {purchase.status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          В обработке
                        </span>
                      )}
                      {purchase.status === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Выполнено
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(purchase.created_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Пользователь ещё не совершил ни одной покупки</p>
        )}
      </div>

      {showEditDialog && (
        <EditUserDialog
          user={user}
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </div>
  );
}
