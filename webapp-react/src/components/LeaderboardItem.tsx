import { motion } from "framer-motion";
import { Crown, Flame } from "lucide-react";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  points: number;
  streak: number;
  reward?: number;
  medal?: "gold" | "silver" | "bronze";
  isMe?: boolean;
}

export const LeaderboardItem = ({
  rank,
  name,
  points,
  streak,
  reward,
  medal,
  isMe,
}: LeaderboardItemProps) => {
  const getMedalColor = () => {
    switch (medal) {
      case "gold":
        return "from-yellow-400 to-yellow-600";
      case "silver":
        return "from-gray-300 to-gray-500";
      case "bronze":
        return "from-orange-400 to-orange-600";
      default:
        return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`flex items-center gap-4 rounded-xl p-3 ${
        isMe
          ? "border-2 border-primary bg-primary/10"
          : "bg-card border border-border"
      }`}
    >
      {/* Rank */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
          medal
            ? `bg-gradient-to-br ${getMedalColor()} text-background`
            : "bg-muted text-muted-foreground"
        }`}
      >
        {rank <= 3 ? <Crown className="h-5 w-5" /> : rank}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">
            {name}
            {isMe && (
              <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                Вы
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{points} XP</span>
          {streak > 0 && (
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-destructive" />
              {streak}
            </span>
          )}
        </div>
      </div>

      {/* Reward */}
      {reward && reward > 0 && (
        <div className="text-right">
          <span className="text-sm font-medium text-primary">+{reward}</span>
          <p className="text-xs text-muted-foreground">монет</p>
        </div>
      )}
    </motion.div>
  );
};
