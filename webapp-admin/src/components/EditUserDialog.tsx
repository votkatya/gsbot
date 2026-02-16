import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

  // Заполняем поля текущими значениями при открытии
  useEffect(() => {
    if (isOpen && user) {
      setCoins(user.coins || 0);
      setXP(user.xp || 0);
      setReason('');
    }
  }, [isOpen, user]);

  const updateMutation = useMutation({
    mutationFn: (data: { coins: number; xp: number; reason: string }) =>
      api.updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      onClose();
      toast.success('Пользователь обновлён!');
    },
    onError: (error: any) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Вычисляем изменения
    const coinsDelta = coins - (user.coins || 0);
    const xpDelta = xp - (user.xp || 0);

    if (coinsDelta === 0 && xpDelta === 0) {
      toast.warning('Значения не изменились');
      return;
    }

    updateMutation.mutate({
      coins: coinsDelta,
      xp: xpDelta,
      reason: reason || `Изменение через админку`
    });
  };

  if (!isOpen) return null;

  const coinsDelta = coins - (user.coins || 0);
  const xpDelta = xp - (user.xp || 0);

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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Спорткоины
            </label>
            <input
              type="number"
              value={coins}
              onChange={(e) => setCoins(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Количество монет"
            />
            {coinsDelta !== 0 && (
              <p className="text-xs mt-1" style={{ color: coinsDelta > 0 ? '#16a34a' : '#dc2626' }}>
                {coinsDelta > 0 ? `+${coinsDelta}` : coinsDelta} монет
              </p>
            )}
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
              placeholder="Количество XP"
            />
            {xpDelta !== 0 && (
              <p className="text-xs mt-1" style={{ color: xpDelta > 0 ? '#16a34a' : '#dc2626' }}>
                {xpDelta > 0 ? `+${xpDelta}` : xpDelta} XP
              </p>
            )}
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

          {(coinsDelta !== 0 || xpDelta !== 0) && (
            <div className="p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium mb-2">Изменения:</p>
              {coinsDelta !== 0 && (
                <p>
                  🪙 Монеты: {user.coins || 0} → <strong>{coins}</strong>
                  <span className={coinsDelta > 0 ? 'text-green-600' : 'text-red-600'}>
                    {' '}({coinsDelta > 0 ? `+${coinsDelta}` : coinsDelta})
                  </span>
                </p>
              )}
              {xpDelta !== 0 && (
                <p>
                  ⭐ XP: {user.xp || 0} → <strong>{xp}</strong>
                  <span className={xpDelta > 0 ? 'text-green-600' : 'text-red-600'}>
                    {' '}({xpDelta > 0 ? `+${xpDelta}` : xpDelta})
                  </span>
                </p>
              )}
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
