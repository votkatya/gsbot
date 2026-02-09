import { motion } from "framer-motion";
import { Coffee, Dumbbell, Sun, ShoppingBag, Droplet, Shirt, Ticket, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  Coffee,
  Dumbbell,
  Sun,
  ShoppingBag,
  Droplet,
  Shirt,
  Ticket,
};

interface ShopItemProps {
  id: string;
  title: string;
  price: number;
  stock: string;
  iconName: string;
  userCoins: number;
  onBuy: (id: string) => void;
}

export const ShopItem = ({
  id,
  title,
  price,
  stock,
  iconName,
  userCoins,
  onBuy,
}: ShopItemProps) => {
  const Icon = iconMap[iconName] || ShoppingBag;
  const canAfford = userCoins >= price;
  const inStock = stock !== "0";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="flex flex-col items-center rounded-2xl bg-card p-4 border border-border"
    >
      {/* Icon */}
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20">
        <Icon className="h-8 w-8 text-primary" />
      </div>

      {/* Title */}
      <h3 className="mb-1 text-center font-semibold text-foreground">{title}</h3>

      {/* Stock */}
      <p className="mb-3 text-xs text-muted-foreground">
        {inStock ? `В наличии: ${stock}` : "Нет в наличии"}
      </p>

      {/* Price & Button */}
      <div className="mt-auto flex w-full items-center justify-between">
        <span className="font-bold text-primary">{price} 🪙</span>
        <Button
          size="sm"
          disabled={!canAfford || !inStock}
          onClick={() => onBuy(id)}
          className={`${
            canAfford && inStock
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          }`}
        >
          Купить
        </Button>
      </div>
    </motion.div>
  );
};
