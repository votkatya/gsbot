import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ReferralFormProps {
  onSubmit: (data: { friendName: string; friendPhone: string }) => void;
  isLoading?: boolean;
}

export const ReferralForm = ({ onSubmit, isLoading }: ReferralFormProps) => {
  const [friendName, setFriendName] = useState("");
  const [friendPhone, setFriendPhone] = useState("");

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format as +7 XXX XXX-XX-XX
    if (digits.length === 0) return "";
    if (digits.length <= 1) return `+7`;
    if (digits.length <= 4) return `+7 ${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 ${digits.slice(1, 4)} ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFriendPhone(formatted);
  };

  const isValid = friendName.trim().length > 0 && friendPhone.replace(/\D/g, "").length === 11;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit({
        friendName: friendName.trim(),
        friendPhone: friendPhone.replace(/\D/g, ""), // Store digits only
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="friendName" className="block text-sm font-medium text-foreground mb-2">
          Имя друга
        </label>
        <input
          id="friendName"
          type="text"
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
          placeholder="Введи имя"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label htmlFor="friendPhone" className="block text-sm font-medium text-foreground mb-2">
          Телефон друга
        </label>
        <input
          id="friendPhone"
          type="tel"
          value={friendPhone}
          onChange={handlePhoneChange}
          placeholder="+7"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
        disabled={!isValid || isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? "Отправляем..." : "Выполнить"}
      </Button>
    </div>
  );
};
