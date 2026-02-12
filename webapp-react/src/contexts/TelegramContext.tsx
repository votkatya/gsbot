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
    console.log("TelegramContext: initializing...");

    const tg = window.Telegram?.WebApp;
    console.log("Telegram WebApp available:", !!tg);

    if (tg) {
      console.log("Telegram WebApp found, calling ready()");
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      const startParam = tg.initDataUnsafe?.start_param || null;

      console.log("Telegram user data:", user);
      console.log("Start param:", startParam);

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
      console.log("Telegram WebApp not found, using fallback");
      setValue((prev) => ({
        ...prev,
        telegramId: import.meta.env.DEV ? 123456789 : null,
        firstName: import.meta.env.DEV ? "Тестовый" : "Атлет",
        isReady: true,
      }));
    }

    console.log("TelegramContext: initialization complete");
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
