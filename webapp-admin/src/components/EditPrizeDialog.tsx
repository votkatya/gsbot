import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface EditPrizeDialogProps {
  prize: any;
  isOpen: boolean;
  onClose: () => void;
}

export function EditPrizeDialog({ prize, isOpen, onClose }: EditPrizeDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (prize) {
      setTitle(prize.title || '');
      setDescription(prize.description || '');
      setPrice(prize.price || 0);
      setIsActive(prize.is_active ?? true);
    }
  }, [prize]);

  const updateMutation = useMutation({
    mutationFn: (data: { title: string; description: string; price: number; is_active: boolean }) =>
      api.updatePrize(prize.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
      onClose();
      toast.success('Приз обновлён!');
    },
    onError: (error: any) => {
      toast.error(`Ошибка: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Введите название приза');
      return;
    }
    if (price <= 0) {
      toast.warning('Цена должна быть больше 0');
      return;
    }
    updateMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      price,
      is_active: isActive,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Редактировать приз
        </h2>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>{prize?.title}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Куплено: {prize?.purchase_count || 0} раз
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Название приза *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Скидка 10% на абонемент"
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
              rows={4}
              placeholder="Подробное описание приза"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Цена (спорткоины) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              step="10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Рекомендуемые значения: 50, 100, 200, 500
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Приз активен (доступен для покупки)
            </label>
          </div>

          {!isActive && (
            <div className="p-3 bg-yellow-50 rounded text-sm text-yellow-800">
              ⚠️ Приз будет скрыт в магазине и недоступен для покупки
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-1">Изменения:</p>
            <ul className="space-y-1 text-gray-700">
              {title !== prize?.title && (
                <li>• Название: "{prize?.title}" → "{title}"</li>
              )}
              {price !== prize?.price && (
                <li>• Цена: {prize?.price} 🪙 → {price} 🪙</li>
              )}
              {isActive !== prize?.is_active && (
                <li>• Статус: {prize?.is_active ? 'Активен' : 'Неактивен'} → {isActive ? 'Активен' : 'Неактивен'}</li>
              )}
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
