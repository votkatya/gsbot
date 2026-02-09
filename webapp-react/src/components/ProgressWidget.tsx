import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface ProgressWidgetProps {
  completed: number;
  total: number;
}

export const ProgressWidget = ({ completed, total }: ProgressWidgetProps) => {
  const percentage = Math.round((completed / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 relative overflow-hidden rounded-2xl bg-card border border-border p-5"
    >
      {/* Trophy background decoration */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
        <Trophy className="h-24 w-24 text-primary" strokeWidth={1} />
      </div>

      <div className="relative z-10">
        {/* Top row: percentage and counter */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-3xl font-bold text-foreground">{percentage}%</p>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Готовность к спорту
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{completed}/{total}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(30, 100%, 50%) 100%)"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};
