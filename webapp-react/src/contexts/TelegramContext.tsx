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

const TelegramContext = createContext<TelegramContextValue>({
  telegramId: null,
  vkId: null,
  platform: null,
  firstName: "Атлет",
  lastName: "",
  username: "",
  isReady: false,
  startParam: null,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramContextValue>({
    telegramId: null,
    vkId: null,
    platform: null,
    firstName: "Атлет",
    lastName: "",
    username: "",
    isReady: false,
    startParam: null,
  });

  useEffect(() => {
    console.log("PlatformContext: initializing...");

    const initPlatform = async () => {
      // 1. Проверяем URL-параметры VK (VK всегда добавляет vk_user_id к URL мини-приложения)
      const urlParams = new URLSearchParams(window.location.search);
      const vkUserIdParam = urlParams.get("vk_user_id");

      if (vkUserIdParam) {
        const vkId = parseInt(vkUserIdParam, 10);
        console.log("VK Mini App detected via URL params, vk_user_id:", vkId);

        // Сразу ставим isReady — vk_user_id уже есть, данные можно грузить
        setValue({
          telegramId: null,
          vkId,
          platform: "vk",
          firstName: "Атлет",
          lastName: "",
          username: "",
          isReady: true,
          startParam: null,
        });

        // Имя подтягиваем в фоне через VK Bridge (не блокируем загрузку)
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("VK Bridge timeout")), 3000)
        );
        Promise.race([bridge.send("VKWebAppGetUserInfo"), timeout])
          .then((userData) => {
            console.log("VK user data from bridge:", userData);
            setValue((prev) => ({
              ...prev,
              firstName: userData.first_name || prev.firstName,
              lastName: userData.last_name || prev.lastName,
            }));
          })
          .catch((e) => {
            console.log("VK Bridge VKWebAppGetUserInfo failed, using URL params only:", e);
          });

        return;
      }

      // 2. Пробуем Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (tg) {
        console.log("Telegram WebApp found, calling ready()");
        tg.ready();
        tg.expand();

        const user = tg.initDataUnsafe?.user;
        const startParam = tg.initDataUnsafe?.start_param || null;

        console.log("Telegram user data:", user);

        setValue({
          telegramId: user?.id || null,
          vkId: null,
          platform: "telegram",
          firstName: user?.first_name || "Атлет",
          lastName: user?.last_name || "",
          username: user?.username || "",
          isReady: true,
          startParam,
        });
        return;
      }

      // 3. Fallback для разработки
      console.log("No platform SDK found, using dev fallback");
      setValue((prev) => ({
        ...prev,
        telegramId: import.meta.env.DEV ? 123456789 : null,
        vkId: null,
        platform: import.meta.env.DEV ? "telegram" : null,
        firstName: import.meta.env.DEV ? "Тестовый" : "Атлет",
        isReady: true,
      }));
    };

    initPlatform();
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
