import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import bridge from "@vkontakte/vk-bridge";

interface TelegramContextValue {
  telegramId: number | null;
  vkId: number | null;
  platform: "telegram" | "vk" | null;
  firstName: string;
  lastName: string;
  username: string;
  isReady: boolean;
  startParam: string | null;
}

const defaultValue: TelegramContextValue = {
  telegramId: null,
  vkId: null,
  platform: null,
  firstName: "Атлет",
  lastName: "",
  username: "",
  isReady: false,
  startParam: null,
};

const TelegramContext = createContext<TelegramContextValue>(defaultValue);

// Определяем платформу синхронно — данные уже доступны при загрузке
function detectPlatform(): TelegramContextValue {
  (window as any).__addTiming?.("detectPlatform вызван");
  // VK: vk_user_id всегда в URL
  const vkUserIdParam = new URLSearchParams(window.location.search).get("vk_user_id");
  if (vkUserIdParam) {
    (window as any).__addTiming?.("VK platform определена");
    return {
      telegramId: null,
      vkId: parseInt(vkUserIdParam, 10),
      platform: "vk",
      firstName: "Атлет",
      lastName: "",
      username: "",
      isReady: true,
      startParam: null,
    };
  }

  // Telegram: SDK доступен синхронно
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    const user = tg.initDataUnsafe?.user;
    return {
      telegramId: user?.id || null,
      vkId: null,
      platform: "telegram",
      firstName: user?.first_name || "Атлет",
      lastName: user?.last_name || "",
      username: user?.username || "",
      isReady: true,
      startParam: tg.initDataUnsafe?.start_param || null,
    };
  }

  // Dev fallback
  return {
    ...defaultValue,
    telegramId: import.meta.env.DEV ? 123456789 : null,
    platform: import.meta.env.DEV ? "telegram" : null,
    firstName: import.meta.env.DEV ? "Тестовый" : "Атлет",
    isReady: true,
  };
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>(detectPlatform);

  // VK: подтягиваем имя в фоне (не блокирует загрузку)
  useEffect(() => {
    if (value.platform !== "vk") return;

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("VK Bridge timeout")), 3000)
    );
    Promise.race([bridge.send("VKWebAppGetUserInfo"), timeout])
      .then((userData) => {
        setValue((prev) => ({
          ...prev,
          firstName: userData.first_name || prev.firstName,
          lastName: userData.last_name || prev.lastName,
        }));
      })
      .catch(() => {});
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
