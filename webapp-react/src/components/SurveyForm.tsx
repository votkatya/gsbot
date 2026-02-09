import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface SurveyFormProps {
  onSubmit: (answers: Record<string, string | string[]>) => void;
  isLoading?: boolean;
}

export const SurveyForm = ({ onSubmit, isLoading }: SurveyFormProps) => {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [hasKids, setHasKids] = useState<string>("");

  const goalOptions = [
    "Похудение",
    "Набор мышц / форма",
    "Здоровье / спина / суставы",
    "Энергия, тонус",
    "Снижение стресса",
  ];

  const toggleGoal = (goal: string) => {
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const isValid = fullName.trim().length > 0 && birthDate.trim().length > 0 && goals.length > 0 && hasKids !== "";

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({
      fullName: fullName.trim(),
      birthDate: birthDate.trim(),
      goals,
      hasKids,
    });
  };

  return (
    <div className="space-y-5">
      {/* ФИО */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          ФИО
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Дата рождения */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Дата рождения
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Цель */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          С какой целью вы пришли в фитнес-клуб?
        </label>
        <p className="mb-2 text-xs text-muted-foreground">Можно выбрать несколько</p>
        <div className="flex flex-wrap gap-2">
          {goalOptions.map((goal) => {
            const selected = goals.includes(goal);
            return (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-all ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                {goal}
              </button>
            );
          })}
        </div>
      </div>

      {/* Дети */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Есть ли у вас дети?
        </label>
        <div className="flex gap-3">
          {["Да", "Нет"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setHasKids(option)}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                hasKids === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопка */}
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
        disabled={!isValid || isLoading}
        onClick={handleSubmit}
      >
        {isLoading ? "Отправка..." : "Отправить и выполнить"}
      </Button>
    </div>
  );
};
