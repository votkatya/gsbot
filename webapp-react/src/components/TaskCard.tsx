import { motion } from "framer-motion";
import {
  CheckCircle2, Lock, QrCode, User, Smartphone, Send,
  Dumbbell, Activity, Sun, Eye, MessageSquare, Trophy,
  Users, Waves, Star,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  User,
  Smartphone,
  Send,
  Dumbbell,
  Activity,
  Sun,
  Eye,
  MessageSquare,
  Trophy,
  Users,
  Waves,
  Star,
};

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

interface TaskCardProps {
  task: Task;
  onScan?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
}

export const TaskCard = ({ task, onScan, onOpenTask }: TaskCardProps) => {
  const Icon = iconMap[task.iconName] || User;
  const isLocked = task.locked;
  const isCompleted = task.completed;

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      className={`relative overflow-hidden rounded-2xl bg-card p-4 transition-all ${
        isLocked ? "opacity-50" : "cursor-pointer"
      } ${isCompleted ? "border border-success/30" : "border border-border"}`}
      onClick={() => !isLocked && onOpenTask?.(task)}
    >
      {/* Completed overlay */}
      {isCompleted && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
      )}

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute right-3 top-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isCompleted
              ? "bg-success/20"
              : isLocked
              ? "bg-muted"
              : "bg-primary/20"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              isCompleted
                ? "text-success"
                : isLocked
                ? "text-muted-foreground"
                : "text-primary"
            }`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStageBadgeClass(
                task.stage
              )}`}
            >
              {getStageLabel(task.stage)}
            </span>
            <span className="text-xs text-muted-foreground">{task.zone}</span>
          </div>
          <h3 className="font-semibold text-foreground">{task.title}</h3>
          {task.subtitle && task.subtitle !== task.title && (
            <p className="text-sm text-muted-foreground">{task.subtitle}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-primary">
                +{task.reward} XP
              </span>
              {task.rewardCoins && task.rewardCoins > 0 && (
                <span className="text-sm font-medium text-yellow-500">
                  +{task.rewardCoins} 🪙
                </span>
              )}
            </div>
            {!isLocked && !isCompleted && (task.verificationType === "qr" || task.verificationType === "code") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onScan?.(task);
                }}
              >
                <QrCode className="h-4 w-4" />
                Скан
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
