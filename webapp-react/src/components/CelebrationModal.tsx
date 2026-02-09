import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Star, Sparkles, Gift, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  xpReward: number;
  coinsReward: number;
}

// Confetti particle component
const Confetti = ({ delay, left }: { delay: number; left: number }) => {
  const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA", "#F472B6", "#34D399"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <motion.div
      initial={{ y: -20, opacity: 1, rotate: 0 }}
      animate={{ 
        y: 400, 
        opacity: [1, 1, 0],
        rotate: Math.random() > 0.5 ? 360 : -360
      }}
      transition={{ 
        duration: 2.5 + Math.random(),
        delay,
        ease: "easeIn"
      }}
      className="absolute w-3 h-3 rounded-sm"
      style={{ 
        left: `${left}%`,
        backgroundColor: color,
        top: 0
      }}
    />
  );
};

export const CelebrationModal = ({ 
  isOpen, 
  onClose, 
  taskTitle, 
  xpReward, 
  coinsReward 
}: CelebrationModalProps) => {
  const [confetti, setConfetti] = useState<{ id: number; delay: number; left: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        left: Math.random() * 100
      }));
      setConfetti(particles);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/90"
          />

          {/* Confetti container */}
          <div className="fixed inset-0 z-[70] overflow-hidden pointer-events-none">
            {confetti.map((particle) => (
              <Confetti key={particle.id} delay={particle.delay} left={particle.left} />
            ))}
          </div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            className="fixed inset-x-4 top-4 bottom-4 z-[70] flex items-center justify-center overflow-y-auto py-4"
          >
            <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-card to-card/95 p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
              {/* Animated icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="relative mb-6"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
                
                {/* Floating stars */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -right-2 -top-2"
                >
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -10, 10, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute -left-2 top-4"
                >
                  <Sparkles className="h-5 w-5 text-primary" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-2xl font-bold text-foreground"
              >
                Отлично! 🎉
              </motion.h2>

              {/* Task name */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-muted-foreground"
              >
                Задание «{taskTitle}» выполнено!
              </motion.p>

              {/* Rewards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6 flex gap-6"
              >
                {/* XP */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20"
                  >
                    <span className="text-2xl">⚡</span>
                  </motion.div>
                  <span className="text-xl font-bold text-primary">+{xpReward}</span>
                  <span className="text-xs text-muted-foreground">XP</span>
                </div>

                {/* Coins */}
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                    className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20"
                  >
                    <span className="text-2xl">🪙</span>
                  </motion.div>
                  <span className="text-xl font-bold text-yellow-500">+{coinsReward}</span>
                  <span className="text-xs text-muted-foreground">Монет</span>
                </div>
              </motion.div>

              {/* Prize hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mb-6 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
              >
                <Gift className="h-4 w-4" />
                <span>Монеты можно потратить в магазине!</span>
              </motion.div>

              {/* Continue button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full"
              >
                <Button onClick={onClose} size="lg" className="w-full">
                  Продолжить
                </Button>
              </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
