import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: number;
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
}

export const TaskModal = ({ task, isOpen, onClose, onScan, onComplete }: TaskModalProps) => {
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
        return "Квест";
      case 3:
        return "Лояльность";
      default:
        return "Этап";
    }
  };

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
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="space-y-4">
              {/* Badge */}
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(
                  task.stage
                )}`}
              >
                {getStageLabel(task.stage)} • {task.zone}
              </span>

              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {task.title}
                </h2>
                <p className="text-muted-foreground">{task.subtitle}</p>
              </div>

              {/* Description */}
              <p className="text-foreground">{task.description}</p>

              {/* Reward */}
              <div className="flex items-center gap-4 rounded-xl bg-primary/10 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="font-bold text-primary">+{task.reward} XP</p>
                  </div>
                </div>
                {task.rewardCoins && task.rewardCoins > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <p className="font-bold text-yellow-500">+{task.rewardCoins}</p>
                    </div>
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
