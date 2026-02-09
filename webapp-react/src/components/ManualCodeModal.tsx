import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManualCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isLoading?: boolean;
}

export const ManualCodeModal = ({ isOpen, onClose, onSubmit, isLoading }: ManualCodeModalProps) => {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim().toUpperCase());
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
            className="fixed inset-0 z-[60] bg-black/80"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 z-[60] -translate-y-1/2 rounded-3xl bg-card p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <Keyboard className="h-10 w-10 text-primary" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-foreground">
                Ввод кода вручную
              </h2>
              <p className="mb-6 text-muted-foreground">
                Введите код, указанный под QR-кодом
              </p>

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Например: GYM-2024-001"
                  className="text-center text-lg uppercase tracking-wider"
                  autoFocus
                  disabled={isLoading}
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!code.trim() || isLoading}
                >
                  {isLoading ? "Проверка..." : "Проверить код"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
