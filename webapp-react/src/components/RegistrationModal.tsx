import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface RegistrationModalProps {
  isOpen: boolean;
  onComplete: (data: {
    fullName: string;
    phone: string;
    membership: string;
  }) => void;
}

export const RegistrationModal = ({ isOpen, onComplete }: RegistrationModalProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [membership, setMembership] = useState("");

  const membershipOptions = [
    { value: "no", label: "Нет" },
    { value: "trial", label: "Пробная неделя" },
    { value: "yes", label: "Да, есть абонемент" },
  ];

  const isValid = fullName.trim().length > 0 && phone.trim().length > 0 && membership !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    onComplete({
      fullName: fullName.trim(),
      phone: phone.trim(),
      membership,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md px-6"
      >
        <div className="rounded-3xl bg-card p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🏋️</div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">
              Добро пожаловать!
            </h2>
            <p className="text-muted-foreground">
              Зарегистрируйся и играй!
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Имя */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Имя и Фамилия
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Телефон */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Абонемент */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                У вас есть абонемент в Город Спорта?
              </label>
              <div className="space-y-2">
                {membershipOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setMembership(option.value)}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition-all ${
                      membership === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-5 w-5 rounded-full border-2 transition-all ${
                          membership === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {membership === option.value && (
                          <div className="flex h-full items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              Продолжить
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
