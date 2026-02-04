# City of Sport — Design System
Документация дизайн-системы для воспроизведения визуального стиля приложения.
## Стек технологий
- **React** + **TypeScript**
- **Tailwind CSS** (с кастомной конфигурацией)
- **shadcn/ui** (библиотека компонентов)
- **Framer Motion** (анимации)
- **Lucide React** (иконки)
---
## Цветовая палитра (HSL)
### Основные цвета
| Токен | HSL | Описание |
|-------|-----|----------|
| `--background` | `240 10% 3.9%` | Тёмный фон приложения |
| `--foreground` | `0 0% 98%` | Основной текст (белый) |
| `--primary` | `48 96% 53%` | Яркий жёлтый (акцент) |
| `--primary-foreground` | `240 10% 3.9%` | Текст на жёлтом фоне |
| `--secondary` | `240 5% 26%` | Zinc (вторичный) |
| `--accent` | `48 96% 53%` | Жёлтый акцент |
### Карточки и поверхности
| Токен | HSL | Описание |
|-------|-----|----------|
| `--card` | `240 6% 10%` | Фон карточек |
| `--muted` | `240 4% 16%` | Приглушённый фон |
| `--muted-foreground` | `240 5% 65%` | Приглушённый текст |
### Статусы
| Токен | HSL | Описание |
|-------|-----|----------|
| `--success` | `142 76% 36%` | Зелёный (успех) |
| `--destructive` | `0 84% 60%` | Красный (ошибка) |
### Границы и элементы форм
| Токен | HSL |
|-------|-----|
| `--border` | `240 4% 16%` |
| `--input` | `240 4% 16%` |
| `--ring` | `48 96% 53%` |
| `--radius` | `0.75rem` |
---
## Градиенты
```css
--gradient-gold: linear-gradient(135deg, hsl(48 96% 53%) 0%, hsl(36 100% 50%) 100%);
--gradient-dark: linear-gradient(180deg, hsl(240 6% 12%) 0%, hsl(240 10% 6%) 100%);
--gradient-card: linear-gradient(145deg, hsl(240 6% 12%) 0%, hsl(240 6% 8%) 100%);
```
---
## Тени
```css
--shadow-glow: 0 0 20px hsla(48, 96%, 53%, 0.3);
--shadow-card: 0 4px 20px hsla(0, 0%, 0%, 0.4);
```
---
## Утилитарные классы
### Свечение (Glow)
```css
.glow-primary {
  box-shadow: 0 0 20px hsla(48, 96%, 53%, 0.4);
}
.glow-primary-sm {
  box-shadow: 0 0 10px hsla(48, 96%, 53%, 0.3);
}
.pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}
```
### Градиентный текст
```css
.text-gradient-gold {
  background: linear-gradient(135deg, hsl(48 96% 53%) 0%, hsl(36 100% 50%) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```
### Стекломорфизм (Glass)
```css
.glass {
  background: hsla(240, 6%, 10%, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid hsla(240, 4%, 20%, 0.5);
}
```
### Бейджи этапов
```css
.badge-stage-1 {
  background: linear-gradient(135deg, hsl(48 96% 53%) 0%, hsl(36 100% 50%) 100%);
  color: hsl(240 10% 3.9%);
}
.badge-stage-2 {
  background: linear-gradient(135deg, hsl(220 70% 50%) 0%, hsl(200 80% 45%) 100%);
  color: hsl(0 0% 98%);
}
.badge-stage-3 {
  background: linear-gradient(135deg, hsl(280 70% 50%) 0%, hsl(260 80% 45%) 100%);
  color: hsl(0 0% 98%);
}
```
---
## Анимации (Tailwind)
### Keyframes
```js
keyframes: {
  shimmer: {
    "0%": { backgroundPosition: "-200% 0" },
    "100%": { backgroundPosition: "200% 0" },
  },
  "slide-up": {
    "0%": { transform: "translateY(10px)", opacity: "0" },
    "100%": { transform: "translateY(0)", opacity: "1" },
  },
  "scale-in": {
    "0%": { transform: "scale(0.95)", opacity: "0" },
    "100%": { transform: "scale(1)", opacity: "1" },
  },
  float: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-5px)" },
  },
  "coin-spin": {
    "0%": { transform: "rotateY(0deg)" },
    "100%": { transform: "rotateY(360deg)" },
  },
}
```
### Классы анимаций
```js
animation: {
  shimmer: "shimmer 2s linear infinite",
  "slide-up": "slide-up 0.4s ease-out",
  "scale-in": "scale-in 0.3s ease-out",
  float: "float 3s ease-in-out infinite",
  "coin-spin": "coin-spin 0.6s ease-in-out",
}
```
---
## Шрифт
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```
---
## Скроллбар
```css
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}
::-webkit-scrollbar-thumb {
  background: hsl(var(--primary));
  border-radius: 4px;
}
```
---
## Адаптивность
- Мобильное приложение (mobile-first)
- Safe area поддержка для iPhone:
```css
.safe-bottom {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}
.safe-top {
  padding-top: max(1rem, env(safe-area-inset-top));
}
```
---
## Компоненты (shadcn/ui)
Используются стандартные компоненты из библиотеки [shadcn/ui](https://ui.shadcn.com/):
- Button
- Card
- Dialog
- Progress
- Tabs
- Badge
- Avatar
- Sheet (модальные окна снизу)
---
## Z-Index иерархия
| Элемент | z-index |
|---------|---------|
| Контент | 0-10 |
| Bottom Navigation | 50 |
| Модальные окна | 60+ |
---
## Пример использования
```tsx
<div className="bg-card rounded-xl p-4 glow-primary-sm">
  <h2 className="text-gradient-gold text-xl font-bold">Заголовок</h2>
  <p className="text-muted-foreground">Описание</p>
  <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
    Кнопка
  </button>
</div>
```