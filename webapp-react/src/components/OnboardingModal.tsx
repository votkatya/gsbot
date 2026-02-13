import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    emoji: "🎮",
    title: "Добро пожаловать в игру!",
    description: "Выполняй задания и знакомься с Городом Спорта."
  },
  {
    emoji: "🪙",
    title: "Получай награды",
    description: "За каждое задание ты получишь монеты и опыт. Чем больше заданий — тем круче награды!"
  },
  {
    emoji: "🎁",
    title: "Обменивай на подарки",
    description: "Копи монеты и обменивай их на реальные призы в магазине наград. Соревнуйся с друзьями в рейтинге!"
  }
];

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem("onboarding_completed", "true");
    onClose();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative w-full max-w-md px-6">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute -top-12 right-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Slides container */}
        <div className="relative h-[400px] overflow-hidden">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6"
            >
              {/* Emoji */}
              <div className="text-8xl mb-4">
                {slides[currentSlide].emoji}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-foreground">
                {slides[currentSlide].title}
              </h2>

              {/* Description */}
              <p className="text-lg text-muted-foreground px-8">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              onClick={prevSlide}
              className="flex-1"
            >
              Назад
            </Button>
          )}
          <Button
            onClick={nextSlide}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {currentSlide === slides.length - 1 ? (
              "Начать!"
            ) : (
              <span className="flex items-center justify-center gap-2">
                Далее
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>

        {/* Skip button */}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={handleClose}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Пропустить
          </button>
        )}
      </div>
    </div>
  );
};
