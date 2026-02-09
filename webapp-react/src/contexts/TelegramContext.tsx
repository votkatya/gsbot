import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface TelegramContextValue {
  telegramId: number | null;
  firstName: string;
  lastName: string;
  username: string;
  isReady: boolean;
  startParam: string | null;
}

const TelegramContext = createContext<TelegramContextValue>({
  telegramId: null,
  firstName: "Атлет",
  lastName: "",
  username: "",
  isReady: false,
  startParam: null,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({
    telegramId: null,
    firstName: "Атлет",
    lastName: "",
    username: "",
    isReady: false,
    startParam: null,
  });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param || null;

      setValue({
        telegramId: user?.id || null,
        firstName: user?.first_name || "Атлет",
        lastName: user?.last_name || "",
        username: user?.username || "",
        isReady: true,
        startParam,
      });
    } else {
      // Development fallback: no Telegram SDK available
      setValue((prev) => ({
        ...prev,
        telegramId: import.meta.env.DEV ? 123456789 : null,
        firstName: import.meta.env.DEV ? "Тестовый" : "Атлет",
        isReady: true,
      }));
    }
  }, []);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
