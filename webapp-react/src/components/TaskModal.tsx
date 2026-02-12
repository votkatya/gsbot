import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyForm } from "@/components/SurveyForm";

interface Task {
  id: number;
  dayNumber?: number;
  stage: number;
  title: string;
  subtitle: string;
  description: string;
  reward: number;
  rewardCoins?: number;
  zone: string;
  completed: boolean;
  locked: boolean;
  iconName: string;
  verificationType?: string;
}

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onScan?: () => void;
  onComplete?: () => void;
  onSurveySubmit?: (answers: Record<string, string | string[]>) => void;
  isSurveyLoading?: boolean;
  onCodeSubmit?: (code: string) => void;
  isCodeLoading?: boolean;
}

export const TaskModal = ({ task, isOpen, onClose, onScan, onComplete, onSurveySubmit, isSurveyLoading, onCodeSubmit, isCodeLoading }: TaskModalProps) => {
  const [appCode, setAppCode] = useState("");

  if (!task) return null;

  const getStageBadgeClass = (stage: number) => {
    switch (stage) {
      case 1:
        return "badge-stage-1";
      case 2:
        return "badge-stage-2";
      case 3:
        return "badge-stage-3";
      default:
        return "badge-stage-1";
    }
  };

  const getStageLabel = (stage: number) => {
    switch (stage) {
      case 1:
        return "Разминка";
      case 2:
        return "Охота в клубе";
      case 3:
        return "Заминка";
      default:
        return "Этап";
    }
  };

  const isSurveyTask = task.dayNumber === 1;
  const isAppTask = task.dayNumber === 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-3xl bg-card p-6 pb-8 safe-bottom max-h-[85vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted z-10"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {isSurveyTask && !task.completed ? (
              /* Survey task layout - compact */
              <div className="space-y-4">
                {/* Top row: badge + reward */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)} • {task.zone}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>
                  <p className="text-sm text-muted-foreground">Заполни анкету</p>
                </div>

                {/* Survey form */}
                <SurveyForm
                  onSubmit={(answers) => onSurveySubmit?.(answers)}
                  isLoading={isSurveyLoading}
                />
              </div>
            ) : isSurveyTask && task.completed ? (
              /* Survey task completed - compact */
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pr-8">{task.title}</h2>
                <p className="text-muted-foreground">Награда получена</p>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 p-4">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <span className="font-semibold text-success">Выполнено!</span>
                </div>
              </div>
            ) : isAppTask && !task.completed ? (
              /* App download task - Будь в курсе */
              <div className="space-y-4">
                {/* Top row: badge + reward */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)} • {task.zone}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>
                </div>

                {/* Description */}
                <p className="text-foreground text-sm">
                  Скачай мобильное приложение Город Спорта, зарегистрируйся, найди код и введи в строку ниже
                </p>

                {/* App links */}
                <div className="space-y-2">
                  <a
                    href="https://apps.apple.com/by/app/%D0%B3%D0%BE%D1%80%D0%BE%D0%B4-%D1%81%D0%BF%D0%BE%D1%80%D1%82%D0%B0-%D0%B2%D0%BE%D1%82%D0%BA%D0%B8%D0%BD%D1%81%D0%BA/id6754234879"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm text-primary hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span>App Store</span>
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=ru.razomovsky.gorod_sporta&hl=ru&pli=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm text-primary hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span>Google Play</span>
                  </a>
                  <a
                    href="https://www.rustore.ru/catalog/app/ru.razomovsky.gorod_sporta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm text-primary hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span>RuStore</span>
                  </a>
                </div>

                {/* Code input */}
                <div>
                  <input
                    type="text"
                    value={appCode}
                    onChange={(e) => setAppCode(e.target.value)}
                    placeholder="Введи код из приложения"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Submit button */}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={!appCode.trim() || isCodeLoading}
                  onClick={() => onCodeSubmit?.(appCode.trim())}
                >
                  {isCodeLoading ? "Проверяем..." : "Выполнить"}
                </Button>
              </div>
            ) : isAppTask && task.completed ? (
              /* App task completed - compact */
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground pr-8">{task.title}</h2>
                <p className="text-muted-foreground">Награда получена</p>
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 p-4">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <span className="font-semibold text-success">Выполнено!</span>
                </div>
              </div>
            ) : (
              /* Default task layout */
              <div className="space-y-4">
                {/* Badge */}
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                >
                  {getStageLabel(task.stage)} • {task.zone}
                </span>

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>
                  <p className="text-muted-foreground">{task.subtitle}</p>
                </div>

                {/* Description */}
                <p className="text-foreground">{task.description}</p>

                {/* Reward */}
                <div className="flex items-center gap-4 rounded-xl bg-primary/10 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <p className="font-bold text-primary">+{task.reward} XP</p>
                  </div>
                  {task.rewardCoins && task.rewardCoins > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🪙</span>
                      <p className="font-bold text-yellow-500">+{task.rewardCoins}</p>
                    </div>
                  )}
                </div>

                {/* Action */}
                {task.completed ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 p-4">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="font-semibold text-success">Выполнено!</span>
                  </div>
                ) : task.verificationType === "qr" || task.verificationType === "code" ? (
                  <Button
                    className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={onScan}
                  >
                    <QrCode className="h-5 w-5" />
                    {task.verificationType === "qr" ? "Сканировать QR-код" : "Ввести код"}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={onComplete}
                  >
                    Выполнить
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
