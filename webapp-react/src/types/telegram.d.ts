interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  HapticFeedback: {
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    impactOccurred: (style: "light" | "medium" | "heavy") => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  showScanQrPopup: (
    params: { text?: string },
    callback?: (text: string) => true | void
  ) => void;
  closeScanQrPopup: () => void;
  version: string;
  colorScheme: "dark" | "light";
  themeParams: Record<string, string>;
}

interface Window {
  Telegram: {
    WebApp: TelegramWebApp;
  };
}
