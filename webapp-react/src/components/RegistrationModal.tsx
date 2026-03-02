import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import * as api from "@/services/api";

interface RegistrationModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onComplete: (data: {
    fullName: string;
    phone: string;
    membership: string;
  }) => void;
}

export const RegistrationModal = ({ isOpen, isLoading, onComplete }: RegistrationModalProps) => {
  const [stage, setStage] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [membership, setMembership] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  // Phone mask: +7 (XXX) XXX-XX-XX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");

    // Strip leading 7 or 8 (country code) if user typed it
    if (digits.startsWith("7") || digits.startsWith("8")) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    let formatted = "+7";
    if (digits.length > 0) formatted += " (" + digits.slice(0, 3);
    if (digits.length >= 3) formatted += ") " + digits.slice(3, 6);
    if (digits.length >= 6) formatted += "-" + digits.slice(6, 8);
    if (digits.length >= 8) formatted += "-" + digits.slice(8, 10);

    setPhone(formatted);
  };

  // Valid when we have exactly 10 digits after +7
  const phoneDigits = phone.replace(/\D/g, "").slice(1);
  const isStage1Valid = fullName.trim().length > 0 && phoneDigits.length === 10;

  const handleStage1Submit = async () => {
    if (!isStage1Valid || isChecking) return;
    setIsChecking(true);
    try {
      const result = await api.checkPhone(phone);
      if (result.exists) {
        // Existing user — link platform ID and open app (skip membership question)
        onComplete({ fullName: fullName.trim(), phone, membership: "existing" });
      } else {
        // New user — ask about membership
        setStage(2);
      }
    } catch {
      // On network error, default to showing membership question
      setStage(2);
    } finally {
      setIsChecking(false);
    }
  };

  const membershipOptions = [
    { value: "no", label: "Нет" },
    { value: "trial", label: "Пробная неделя" },
    { value: "yes", label: "Да, есть абонемент" },
  ];

  const handleStage2Submit = () => {
    if (!membership || isLoading) return;
    onComplete({ fullName: fullName.trim(), phone, membership });
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

          {/* ── STAGE 1: Name + Phone ── */}
          {stage === 1 && (
            <>
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
                    inputMode="numeric"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button
                  onClick={handleStage1Submit}
                  disabled={!isStage1Valid || isChecking || isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  {isChecking ? "Проверяем..." : "Продолжить"}
                </Button>
              </div>
            </>
          )}

          {/* ── STAGE 2: Membership question ── */}
          {stage === 2 && (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mb-4 text-6xl">🏋️</div>
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Последний шаг!
                </h2>
                <p className="text-muted-foreground">
                  Расскажи о своём абонементе
                </p>
              </div>

              <div className="space-y-5">
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

                <Button
                  onClick={handleStage2Submit}
                  disabled={!membership || isLoading}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  {isLoading ? "Отправка..." : "Зарегистрироваться"}
                </Button>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
};
