import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ProgressWidget } from "@/components/ProgressWidget";
import { TaskCard } from "@/components/TaskCard";
// Force rebuild 2024-02-13
import { TaskModal } from "@/components/TaskModal";
import { BottomNav } from "@/components/BottomNav";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { ShopItem } from "@/components/ShopItem";
import { QRScannerModal } from "@/components/QRScannerModal";
import { ManualCodeModal } from "@/components/ManualCodeModal";
import { CelebrationModal } from "@/components/CelebrationModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { RegistrationModal } from "@/components/RegistrationModal";
import { toast } from "sonner";
import { useTelegram } from "@/contexts/TelegramContext";
import * as api from "@/services/api";
import {
  mapApiTasks,
  mapApiShopItem,
  mapLeaderboard,
  type Task,
  type ShopItemView,
  type LeaderboardEntry,
} from "@/services/mappers";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { telegramId, firstName, isReady, startParam } = useTelegram();

  const [activeTab, setActiveTab] = useState("home");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // QR Scanner state
  const [scanningTask, setScanningTask] = useState<Task | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCodeChecking, setIsCodeChecking] = useState(false);
  const [isSurveyLoading, setIsSurveyLoading] = useState(false);
  const [isAppCodeLoading, setIsAppCodeLoading] = useState(false);
  const [isReferralLoading, setIsReferralLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);

  // Celebration state
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    title: string;
    xp: number;
    coins: number;
  } | null>(null);

  // Registration & Onboarding state
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // User state
  const [userXP, setUserXP] = useState(0);
  const [userCoins, setUserCoins] = useState(0);
  const [userName, setUserName] = useState("Атлет");

  // Data loading
  const [isLoading, setIsLoading] = useState(true);
  const [userNotFound, setUserNotFound] = useState(false);
  const [serverError, setServerError] = useState(false);

  // Shop & Leaderboard
  const [shopItems, setShopItems] = useState<ShopItemView[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // --- Check registration & onboarding on first load ---
  useEffect(() => {
    const hasRegistered = localStorage.getItem("registration_completed");
    const hasSeenOnboarding = localStorage.getItem("onboarding_completed");

    if (!hasRegistered) {
      // Show registration first
      setIsRegistrationOpen(true);
    } else if (!hasSeenOnboarding) {
      // Then show onboarding
      setIsOnboardingOpen(true);
    }
  }, []);

  // --- Load all data ---
  useEffect(() => {
    console.log("Index: loadData effect triggered", { isReady, telegramId });
    if (!isReady || !telegramId) {
      console.log("Index: Waiting for Telegram context to be ready");
      return;
    }

    async function loadData() {
      console.log("Index: Starting data load...");
      setIsLoading(true);
      setServerError(false);
      try {
        // Load user + tasks
        const userData = await api.fetchUser(telegramId!);
        if (userData) {
          setUserXP(userData.user.xp);
          setUserCoins(userData.user.coins);
          setUserName(userData.user.first_name || "Атлет");
          setTasks(mapApiTasks(userData.tasks));
          setUserNotFound(false);
          setServerError(false);
        } else {
          // Could be user not found OR server error
          // Let's try to load shop to differentiate
          const shopData = await api.fetchShop();
          if (shopData.length === 0) {
            // Server might be down
            setServerError(true);
            setUserNotFound(false);
          } else {
            // User not found - clear localStorage and show registration
            setUserNotFound(true);
            setServerError(false);
            localStorage.removeItem("registration_completed");
            localStorage.removeItem("onboarding_completed");
            setIsRegistrationOpen(true);
          }
        }

        // Load shop
        if (!serverError) {
          const shopData = await api.fetchShop();
          setShopItems(shopData.map(mapApiShopItem));

          // Load leaderboard
          const lbData = await api.fetchLeaderboard();
          setLeaderboard(mapLeaderboard(lbData, telegramId!));
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setServerError(true);
        toast.error("Не удалось подключиться к серверу");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isReady, telegramId]);

  // --- Handle QR deep link from startParam ---
  useEffect(() => {
    if (!startParam || !tasks.length || !telegramId) return;

    if (startParam.startsWith("qr_")) {
      const qrCode = startParam.substring(3);
      // Find the task that matches this QR code
      const task = tasks.find(
        (t) =>
          t.verificationData?.qr_code === qrCode && !t.completed
      );
      if (task) {
        // Auto-complete via API
        api
          .completeTask(telegramId, task.dayNumber, "qr", qrCode)
          .then((result) => {
            if (result.success) {
              setTasks((prev) =>
                prev.map((t) =>
                  t.dayNumber === task.dayNumber
                    ? { ...t, completed: true }
                    : t
                )
              );
              setUserCoins(result.coins || userCoins);
              setUserXP((prev) => prev + (result.reward || 0));

              setCelebrationData({
                title: task.title,
                xp: result.reward || 0,
                coins: result.reward || 0,
              });
              setIsCelebrationOpen(true);

              window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
                "success"
              );
            }
          })
          .catch(() => {
            toast.error("Ошибка при автоматическом выполнении задания");
          });
      }
    }
  }, [startParam, tasks, telegramId]);

  // Tasks grouped by stage
  const stage1Tasks = tasks.filter((t) => t.stage === 1);
  const stage2Tasks = tasks.filter((t) => t.stage === 2);
  const stage3Tasks = tasks.filter((t) => t.stage === 3);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleScan = (task?: Task) => {
    const taskToScan = task || selectedTask;
    if (taskToScan) {
      setScanningTask(taskToScan);
      setIsQRModalOpen(true);
      setIsModalOpen(false);
    }
  };

  const handleManualInput = () => {
    setIsQRModalOpen(false);
    setIsManualModalOpen(true);
  };

  const handleCodeSubmit = async (code: string) => {
    if (!scanningTask || !telegramId) return;
    setIsCodeChecking(true);

    try {
      const result = await api.completeTask(
        telegramId,
        scanningTask.dayNumber,
        scanningTask.verificationType,
        code
      );

      if (result.success) {
        // Update local state
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === scanningTask.dayNumber
              ? { ...t, completed: true }
              : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        // Show celebration
        setCelebrationData({
          title: scanningTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsManualModalOpen(false);
        setIsCelebrationOpen(true);
        setScanningTask(null);

        // Haptic feedback
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Неверный код. Попробуйте ещё раз.");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch {
      toast.error("Ошибка сети. Попробуйте позже.");
    } finally {
      setIsCodeChecking(false);
    }
  };

  // Handle self-verification tasks (stage 1 and some stage 3)
  const handleCompleteTask = async (task: Task) => {
    if (!telegramId) return;

    try {
      const result = await api.completeTask(
        telegramId,
        task.dayNumber,
        "self"
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === task.dayNumber ? { ...t, completed: true } : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: task.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsModalOpen(false);
        setIsCelebrationOpen(true);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Ошибка выполнения задания");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  // Handle survey submission (task 1)
  const handleSurveySubmit = async (answers: Record<string, string | string[]>) => {
    if (!selectedTask || !telegramId) return;
    setIsSurveyLoading(true);

    try {
      const result = await api.submitSurvey(
        telegramId,
        selectedTask.dayNumber,
        answers
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === selectedTask.dayNumber ? { ...t, completed: true } : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: selectedTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsModalOpen(false);
        setIsCelebrationOpen(true);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      } else {
        toast.error(result.error || "Ошибка отправки анкеты");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setIsSurveyLoading(false);
    }
  };

  // Handle app code submission (task 2 - Будь в курсе)
  const handleAppCodeSubmit = async (code: string) => {
    if (!selectedTask || !telegramId) return;
    setIsAppCodeLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "app_code",
        code
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === selectedTask.dayNumber
              ? { ...t, completed: true }
              : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: selectedTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsModalOpen(false);
        setIsCelebrationOpen(true);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Неверный код");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "error"
        );
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setIsAppCodeLoading(false);
    }
  };

  // Handle referral form submission (task 13 - Подарить купон другу)
  const handleReferralSubmit = async (data: { friendName: string; friendPhone: string }) => {
    if (!selectedTask || !telegramId) return;
    setIsReferralLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "referral_form",
        JSON.stringify(data)
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === selectedTask.dayNumber
              ? { ...t, completed: true }
              : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: selectedTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsModalOpen(false);
        setIsCelebrationOpen(true);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Ошибка отправки формы");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setIsReferralLoading(false);
    }
  };

  // Handle registration completion
  const handleRegistrationComplete = async (data: {
    fullName: string;
    phone: string;
    membership: string;
  }) => {
    console.log("Registration data:", data);

    // Save to backend
    if (telegramId) {
      try {
        const result = await api.submitRegistration(
          telegramId,
          data.fullName,
          data.phone,
          data.membership
        );

        if (result.success) {
          console.log("✅ Registration saved to database");
          // Update local user name
          setUserName(data.fullName.split(" ")[0] || "Атлет");
        } else {
          console.error("❌ Registration failed:", result.error);
          toast.error(result.error || "Ошибка регистрации");
        }
      } catch (error) {
        console.error("❌ Registration network error:", error);
        toast.error("Ошибка сети");
      }
    }

    // Save to localStorage
    localStorage.setItem("registration_completed", "true");
    localStorage.setItem("registration_data", JSON.stringify(data));

    // Close registration and show onboarding
    setIsRegistrationOpen(false);
    setIsOnboardingOpen(true);

    // Haptic feedback
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
  };

  // Handle quiz submission (task 14 - Пройди тест)
  const handleQuizSubmit = async (score: number) => {
    if (!selectedTask || !telegramId) return;
    setIsQuizLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "quiz",
        JSON.stringify({ score })
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === selectedTask.dayNumber
              ? { ...t, completed: true }
              : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: selectedTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsModalOpen(false);
        setIsCelebrationOpen(true);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Ошибка выполнения теста");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setIsQuizLoading(false);
    }
  };

  // Handle QR code scanned via native Telegram scanner
  const handleQRScanned = async (scannedText: string) => {
    if (!scanningTask || !telegramId) return;

    setIsQRModalOpen(false);
    setIsCodeChecking(true);

    try {
      const result = await api.completeTask(
        telegramId,
        scanningTask.dayNumber,
        scanningTask.verificationType,
        scannedText
      );

      if (result.success) {
        setTasks((prev) =>
          prev.map((t) =>
            t.dayNumber === scanningTask.dayNumber
              ? { ...t, completed: true }
              : t
          )
        );
        setUserCoins(result.coins || userCoins);
        setUserXP((prev) => prev + (result.reward || 0));

        setCelebrationData({
          title: scanningTask.title,
          xp: result.reward || 0,
          coins: result.reward || 0,
        });
        setIsCelebrationOpen(true);
        setScanningTask(null);

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      } else {
        toast.error(result.error || "QR-код не подходит к этому заданию.");
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
      }
    } catch {
      toast.error("Ошибка сети. Попробуйте позже.");
    } finally {
      setIsCodeChecking(false);
    }
  };

  const handleBuyItem = async (id: string) => {
    if (!telegramId) return;
    const item = shopItems.find((i) => i.id === id);
    if (!item || userCoins < item.price) {
      toast.error("Недостаточно монет");
      return;
    }

    try {
      const result = await api.purchaseItem(telegramId, Number(id));
      if (result.success) {
        setUserCoins(result.coins ?? userCoins - item.price);
        toast.success(`Вы купили: ${item.title}`);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success"
        );
      } else {
        toast.error(result.error || "Ошибка покупки");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // --- Server error ---
  if (serverError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-foreground">
            Сервер временно недоступен
          </h2>
          <p className="text-muted-foreground">
            Не удалось подключиться к серверу. Пожалуйста, попробуйте позже или обратитесь к администратору.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // --- User not found ---
  if (userNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="text-center space-y-4">
          <div className="text-5xl">🏋️</div>
          <h2 className="text-xl font-bold text-foreground">
            Добро пожаловать в Город Спорта!
          </h2>
          <p className="text-muted-foreground">
            Чтобы начать, запустите бота в Telegram и нажмите кнопку «Начать».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header userName={userName} xp={userXP} coins={userCoins} />

      {activeTab === "home" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 pt-4"
        >
          {/* Progress Widget */}
          <ProgressWidget completed={completedTasks} total={totalTasks} />

          {/* Stage 1: Warmup */}
          {stage1Tasks.length > 0 && (
            <section className="px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">
                🔥 Разминка
              </h2>
              <div className="space-y-3">
                {stage1Tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={handleOpenTask}
                    onScan={handleScan}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Stage 2: Quest */}
          {stage2Tasks.length > 0 && (
            <section className="px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">
                🎯 Охота в клубе
              </h2>
              <div className="space-y-3">
                {stage2Tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={handleOpenTask}
                    onScan={handleScan}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Stage 3: Loyalty */}
          {stage3Tasks.length > 0 && (
            <section className="px-4">
              <h2 className="mb-3 text-lg font-bold text-foreground">
                🏆 Заминка
              </h2>
              <div className="space-y-3">
                {stage3Tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onOpenTask={handleOpenTask}
                    onScan={handleScan}
                  />
                ))}
              </div>
            </section>
          )}
        </motion.div>
      )}

      {activeTab === "leaderboard" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 p-4 pt-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">🏆 Рейтинг</h2>
            <p className="text-muted-foreground">Топ участников недели</p>
          </div>

          <div className="space-y-3">
            {leaderboard.map((item) => (
              <LeaderboardItem key={item.rank} {...item} />
            ))}
          </div>

          {leaderboard.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Рейтинг пока пуст
            </p>
          )}

          {/* Leagues info */}
          <div className="mt-6 rounded-2xl bg-card p-4 border border-border">
            <h3 className="mb-3 font-bold text-foreground">Лиги</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">🥉 Бронза</span>
                <span className="text-foreground">0 - 500 XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">🥈 Серебро</span>
                <span className="text-foreground">501 - 1500 XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">🥇 Золото</span>
                <span className="text-foreground">1501 - 3000 XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">💎 Платина</span>
                <span className="text-foreground">3000+ XP</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "shop" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 p-4 pt-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">🛒 Магазин</h2>
            <p className="text-muted-foreground">Трать монеты на призы</p>
            <p className="mt-2 text-lg font-bold text-primary">
              У вас: {userCoins} 🪙
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {shopItems.map((item) => (
              <ShopItem
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                stock={item.stock}
                iconName={item.iconName}
                userCoins={userCoins}
                onBuy={handleBuyItem}
              />
            ))}
          </div>

          {shopItems.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Магазин пока пуст
            </p>
          )}
        </motion.div>
      )}

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScan={() => handleScan(selectedTask || undefined)}
        onComplete={() => {
          if (selectedTask) handleCompleteTask(selectedTask);
        }}
        onSurveySubmit={handleSurveySubmit}
        isSurveyLoading={isSurveyLoading}
        onCodeSubmit={handleAppCodeSubmit}
        isCodeLoading={isAppCodeLoading}
        onReferralSubmit={handleReferralSubmit}
        isReferralLoading={isReferralLoading}
        onQuizSubmit={handleQuizSubmit}
        isQuizLoading={isQuizLoading}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setScanningTask(null);
        }}
        onManualInput={handleManualInput}
        onQRScanned={handleQRScanned}
      />

      {/* Manual Code Input Modal */}
      <ManualCodeModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setScanningTask(null);
        }}
        onSubmit={handleCodeSubmit}
        isLoading={isCodeChecking}
      />

      {/* Celebration Modal */}
      {celebrationData && (
        <CelebrationModal
          isOpen={isCelebrationOpen}
          onClose={() => {
            setIsCelebrationOpen(false);
            setCelebrationData(null);
          }}
          taskTitle={celebrationData.title}
          xpReward={celebrationData.xp}
          coinsReward={celebrationData.coins}
        />
      )}

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onComplete={handleRegistrationComplete}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* Hide bottom nav during registration and onboarding */}
      {!isRegistrationOpen && !isOnboardingOpen && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default Index;
