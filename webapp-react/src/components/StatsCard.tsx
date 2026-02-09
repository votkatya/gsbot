import { motion } from "framer-motion";
import { Coins, Zap, Flame } from "lucide-react";

interface StatsCardProps {
  xp: number;
  coins: number;
  streak: number;
}

export const StatsCard = ({ xp, coins, streak }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 rounded-2xl bg-card-gradient p-4 shadow-lg"
    >
      <div className="grid grid-cols-3 gap-4">
        {/* XP */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">{xp}</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>

        {/* Coins */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground">{coins}</span>
          <span className="text-xs text-muted-foreground">Монеты</span>
        </div>

        {/* Streak */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20">
            <Flame className="h-5 w-5 text-destructive" />
          </div>
          <span className="text-lg font-bold text-foreground">{streak}</span>
          <span className="text-xs text-muted-foreground">Серия</span>
        </div>
      </div>
    </motion.div>
  );
};
