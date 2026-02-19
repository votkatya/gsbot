import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyForm } from "@/components/SurveyForm";
import { ReferralForm } from "@/components/ReferralForm";
import { QuizForm } from "@/components/QuizForm";

interface Task {
  id: number;
  dayNumber?: number;
  stage: number;
  title: string;
  subtitle: string;
  description: string;
  instruction?: string;
  reward: number;
  rewardCoins?: number;
  zone: string;
  completed: boolean;
  reviewPending?: boolean;
  locked: boolean;
  iconName: string;
  verificationType?: string;
  verificationData?: any;
}

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onScan?: () => void;
  onComplete?: () => void;
  onReviewSubmit?: () => void;
  onSurveySubmit?: (answers: Record<string, string | string[]>) => void;
  isSurveyLoading?: boolean;
  onCodeSubmit?: (code: string) => void;
  isCodeLoading?: boolean;
  onReferralSubmit?: (data: { friendName: string; friendPhone: string }) => void;
  isReferralLoading?: boolean;
  onQuizSubmit?: (score: number) => void;
  isQuizLoading?: boolean;
}

// Helper function to convert URLs and Markdown-style links to clickable links
const renderDescriptionWithLinks = (text: string) => {
  // First, handle markdown-style links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Then handle plain URLs (http:// or https://)
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // Process both markdown links and plain URLs
  const combinedRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Markdown-style link [text](url)
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 font-medium"
        >
          {linkText}
        </a>
      );
    } else if (match[3]) {
      // Plain URL
      const url = match[3];
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 font-medium"
        >
          {url}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export const TaskModal = ({
  task,
  isOpen,
  onClose,
  onScan,
  onComplete,
  onReviewSubmit,
  onSurveySubmit,
  isSurveyLoading,
  onCodeSubmit,
  isCodeLoading,
  onReferralSubmit,
  isReferralLoading,
  onQuizSubmit,
  isQuizLoading
}: TaskModalProps) => {
  const [code, setCode] = useState("");

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

  // Determine task types
  const isSurveyTask = task.dayNumber === 1;
  const isAppTask = task.dayNumber === 2;
  const isReferralTask = task.verificationType === "referral_form";
  const isQuizTask = task.verificationType === "quiz";
  const isReviewTask = task.dayNumber === 11; // Leave review task
  const isStage1or3 = task.stage === 1 || task.stage === 3;
  const isStage2 = task.stage === 2;
  const needsCodeInput = (isStage1or3 && !isSurveyTask && !isAppTask && !isReferralTask && !isQuizTask && !isReviewTask) || task.verificationType === "self";
  const needsQRScan = isStage2 && (task.verificationType === "qr" || task.verificationType === "code" || task.verificationType === "qr_or_manual");

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

            {/* COMPLETED STATE - Same for all tasks */}
            {task.completed ? (
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Completed badge */}
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 p-4">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <span className="font-semibold text-success">Награда получена</span>
                </div>
              </div>
            ) : isSurveyTask ? (
              /* SURVEY TASK (Day 1) */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Survey form */}
                <SurveyForm
                  onSubmit={(answers) => onSurveySubmit?.(answers)}
                  isLoading={isSurveyLoading}
                />
              </div>
            ) : isAppTask ? (
              /* APP DOWNLOAD TASK (Day 2) */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Code input */}
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Введи код из приложения"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Submit button */}
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  disabled={!code.trim() || isCodeLoading}
                  onClick={() => {
                    onCodeSubmit?.(code.trim());
                    setCode("");
                  }}
                >
                  {isCodeLoading ? "Проверяем..." : "Выполнить"}
                </Button>
              </div>
            ) : isReviewTask ? (
              /* REVIEW TASK (Day 11) - Leave review */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Instruction */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <p className="text-sm text-foreground">
                    📸 Сделай скриншот отзыва и нажми кнопку ниже. Отправь скриншот боту — мы его проверим и начислим бонусы!
                  </p>
                </div>

                {/* Review link */}
                {task.verificationData?.url && (
                  <a
                    href={task.verificationData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm text-primary hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span>Оставить отзыв на Яндекс Картах</span>
                  </a>
                )}

                {/* Pending / Submit button */}
                {task.reviewPending ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4">
                    <span className="text-lg">⏳</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">Скриншот на проверке</span>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={onReviewSubmit}
                  >
                    Отправить скриншот
                  </Button>
                )}
              </div>
            ) : isReferralTask ? (
              /* REFERRAL TASK (Day 13) - Refer a friend */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Referral form */}
                <ReferralForm
                  onSubmit={(data) => onReferralSubmit?.(data)}
                  isLoading={isReferralLoading}
                />
              </div>
            ) : isQuizTask ? (
              /* QUIZ TASK (Day 14) - Take the quiz */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Quiz form */}
                <QuizForm
                  questions={task.verificationData?.questions || []}
                  onSubmit={(score) => onQuizSubmit?.(score)}
                  isLoading={isQuizLoading}
                />
              </div>
            ) : needsQRScan ? (
              /* STAGE 2 - QR SCAN TASKS */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Instruction block */}
                {task.instruction && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <h3 className="text-sm font-semibold text-primary mb-2">📋 Инструкция:</h3>
                    <p className="text-sm text-foreground whitespace-pre-line">{task.instruction}</p>
                  </div>
                )}

                {/* Scan button */}
                <Button
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                  onClick={onScan}
                >
                  <QrCode className="h-5 w-5" />
                  Сканировать QR-код
                </Button>

                {/* Manual code input for qr_or_manual tasks */}
                {task.verificationType === "qr_or_manual" && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">или</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Введи код вручную"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                      maxLength={5}
                    />

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      size="lg"
                      disabled={!code.trim() || isCodeLoading}
                      onClick={() => {
                        onCodeSubmit?.(code.trim());
                        setCode("");
                      }}
                    >
                      {isCodeLoading ? "Проверяем..." : "Отправить код"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              /* STAGE 1 & 3 - CODE INPUT TASKS (except survey and app) */
              <div className="space-y-4">
                {/* Header with badge and rewards */}
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${getStageBadgeClass(task.stage)}`}
                  >
                    {getStageLabel(task.stage)}
                  </span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-primary">+{task.reward} XP</span>
                    {task.rewardCoins && task.rewardCoins > 0 && (
                      <span className="font-medium text-yellow-500">+{task.rewardCoins} 🪙</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground">{task.title}</h2>

                {/* Description */}
                <p className="text-foreground whitespace-pre-line">{renderDescriptionWithLinks(task.description)}</p>

                {/* Code input or just button */}
                {task.verificationType === "self" ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={onComplete}
                  >
                    Выполнить
                  </Button>
                ) : (
                  <>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Введи код"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <Button
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      size="lg"
                      disabled={!code.trim() || isCodeLoading}
                      onClick={() => {
                        onCodeSubmit?.(code.trim());
                        setCode("");
                      }}
                    >
                      {isCodeLoading ? "Проверяем..." : "Выполнить"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
