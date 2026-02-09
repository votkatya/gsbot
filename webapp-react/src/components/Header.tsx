import { motion } from "framer-motion";
import { Coins, Zap } from "lucide-react";

interface HeaderProps {
  userName: string;
  xp: number;
  coins: number;
}

export const Header = ({ userName, xp, coins }: HeaderProps) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 glass safe-top"
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo & Greeting */}
        <div>
          <h1 className="text-xl font-bold text-gradient-gold">Город Спорта</h1>
          <p className="text-sm text-muted-foreground">
            Привет, {userName || "Атлет"}!
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{xp}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{coins}</span>
          </div>
        </div>
      </div>
    </motion.header>
  );
};
