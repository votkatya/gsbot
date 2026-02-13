import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface EditUserDialogProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditUserDialog({ user, isOpen, onClose }: EditUserDialogProps) {
  const queryClient = useQueryClient();
  const [coins, setCoins] = useState<number>(0);
  const [xp, setXP] = useState<number>(0);
  const [reason, setReason] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data: { coins: number; xp: number; reason: string }) =>
      api.updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
      setCoins(0);
      setXP(0);
      setReason('');
      alert('Пользователь обновлён!');
    },
    onError: (error: any) => {
      alert(`Ошибка: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (coins === 0 && xp === 0) {
      alert('Укажите количество монет или XP');
      return;
    }
    updateMutation.mutate({ coins, xp, reason });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">
          Редактировать пользователя
        </h2>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>{user.first_name} {user.last_name}</strong>
          </p>
          <p className="text-sm text-gray-500">@{user.username || 'без username'}</p>
          <p className="text-sm mt-2">
            Текущие: <strong>{user.coins} 🪙</strong> | <strong>{user.xp} XP</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Спортики (монеты)
            </label>
            <input
              type="number"
              value={coins}
              onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите число (+10 или -5)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Положительное для начисления, отрицательное для списания
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Опыт (XP)
            </label>
            <input
              type="number"
              value={xp}
              onChange={(e) => setXP(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите число (+50 или -20)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Положительное для начисления, отрицательное для списания
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Причина (необязательно)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Например: Бонус за активность"
            />
          </div>

          {coins !== 0 && (
            <div className="p-3 bg-blue-50 rounded text-sm">
              <p>
                Новый баланс: <strong>{user.coins + coins} 🪙</strong>
                {coins > 0 ? ` (+${coins})` : ` (${coins})`}
              </p>
            </div>
          )}

          {xp !== 0 && (
            <div className="p-3 bg-green-50 rounded text-sm">
              <p>
                Новый XP: <strong>{user.xp + xp} XP</strong>
                {xp > 0 ? ` (+${xp})` : ` (${xp})`}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={updateMutation.isPending}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
