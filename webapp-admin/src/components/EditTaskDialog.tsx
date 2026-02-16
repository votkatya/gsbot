import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EditTaskDialogProps {
  task: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTaskDialog({ task, isOpen, onClose }: EditTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coinsReward, setCoinsReward] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setCoinsReward(task.coins_reward || 0);

      // Извлекаем проверочный код из verification_data
      const verData = task.verification_data || {};
      if (verData.qr_code) {
        setVerificationCode(verData.qr_code);
      } else if (verData.test_code) {
        setVerificationCode(verData.test_code);
      } else {
        setVerificationCode('');
      }
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; description: string; coins_reward: number; verification_type: string; verification_data: any }) =>
      api.updateTask(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
      toast.success('Задание обновлено!');
    },
    onError: (error: any) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Введите название задания');
      return;
    }

    // Обновляем verification_data с новым кодом
    let updatedVerificationData = { ...task.verification_data };

    // Определяем, какое поле кода использовать в зависимости от типа проверки
    if (task.verification_type === 'qr') {
      updatedVerificationData.qr_code = verificationCode.trim();
    } else if (task.verification_type === 'app_code' || task.verification_type === 'qr_or_manual') {
      updatedVerificationData.test_code = verificationCode.trim();
    }

    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      coins_reward: coinsReward,
      verification_type: task.verification_type,
      verification_data: updatedVerificationData,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Редактировать задание
        </h2>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>День {task?.day_number}</strong> • {task?.verification_type}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Выполнено: {task?.completed_count || 0} раз
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Название задания *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Подпишись на нас"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              placeholder="Подробное описание задания для пользователей"
            />
            <p className="text-xs text-gray-500 mt-1">
              Поддерживаются ссылки в формате [текст](url)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Награда (спорткоины)
            </label>
            <input
              type="number"
              value={coinsReward}
              onChange={(e) => setCoinsReward(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="10"
            />
            <p className="text-xs text-gray-500 mt-1">
              Рекомендуемые значения: 10, 20, 50, 100
            </p>
          </div>

          {/* Поле для проверочного кода */}
          {(task?.verification_type === 'qr' ||
            task?.verification_type === 'app_code' ||
            task?.verification_type === 'qr_or_manual') && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Проверочный код
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Например: SPORT2025"
              />
              <p className="text-xs text-gray-500 mt-1">
                {task?.verification_type === 'qr' && 'Код для QR-проверки'}
                {task?.verification_type === 'app_code' && 'Тестовый код для проверки из приложения'}
                {task?.verification_type === 'qr_or_manual' && 'Тестовый код для проверки (QR или ручной ввод)'}
              </p>
              {verificationCode && (
                <p className="text-xs text-green-600 mt-1 font-mono">
                  Текущий код: {verificationCode}
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-1">Изменения:</p>
            <ul className="space-y-1 text-gray-700">
              {title !== task?.title && (
                <li>• Название: "{task?.title}" → "{title}"</li>
              )}
              {coinsReward !== task?.coins_reward && (
                <li>• Награда: {task?.coins_reward} 🪙 → {coinsReward} 🪙</li>
              )}
              {(() => {
                const oldCode = task?.verification_data?.qr_code || task?.verification_data?.test_code || '';
                return verificationCode !== oldCode && verificationCode.trim() !== '' && (
                  <li>• Проверочный код: "{oldCode}" → "{verificationCode}"</li>
                );
              })()}
            </ul>
          </div>

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
