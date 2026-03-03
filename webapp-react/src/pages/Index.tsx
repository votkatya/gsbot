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
  const { telegramId, vkId, firstName, lastName, username, isReady, startParam } = useTelegram();

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
  const [serverError, setServerError] = useState(false);

  // Shop & Leaderboard
  const [shopItems, setShopItems] = useState<ShopItemView[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Cart & purchase history
  const [cart, setCart] = useState<string[]>([]);
  const [isCartPaying, setIsCartPaying] = useState(false);
  const [myPurchases, setMyPurchases] = useState<api.ApiPurchase[]>([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);

  // Stage visibility
  const [stage2Visible, setStage2Visible] = useState(false);
  const [stage3Visible, setStage3Visible] = useState(false);

  // --- Check onboarding on first load ---
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("onboarding_completed");
    const hasRegistered = localStorage.getItem("registration_completed");

    // Show onboarding only if user has registered but hasn't seen onboarding
    if (hasRegistered && !hasSeenOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // --- Load purchases when shop tab opens ---
  useEffect(() => {
    if (activeTab === "shop" && (telegramId || vkId)) {
      loadMyPurchases();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, telegramId, vkId]);

  // --- Reload leaderboard ---
  const reloadLeaderboard = async () => {
    if (!telegramId && !vkId) return;
    try {
      const lbData = await api.fetchLeaderboard();
      setLeaderboard(mapLeaderboard(lbData, telegramId, vkId));
    } catch (err) {
      console.error("Failed to reload leaderboard:", err);
    }
  };

  // --- Reload tasks ---
  const reloadTasks = async () => {
    if (!telegramId && !vkId) return;
    try {
      const userData = await api.fetchUser(telegramId, vkId);
      if (userData && userData.tasks) {
        const newTasks = mapApiTasks(userData.tasks);
        setTasks(newTasks);
      }
    } catch (err) {
      console.error("Failed to reload tasks:", err);
    }
  };

  // --- Load all data ---
  const loadData = async () => {
    if (!isReady) return;
    if (!telegramId && !vkId) {
      // Платформа определилась, но ID нет — показываем регистрацию
      console.log("Index: No platform ID, showing registration");
      setIsLoading(false);
      setIsRegistrationOpen(true);
      return;
    }

    console.log("Index: Starting data load...");
    setIsLoading(true);
    setServerError(false);
    try {
      // Load user + tasks
      const userData = await api.fetchUser(telegramId, vkId);

      // Always load shop and leaderboard regardless of user status
      const shopData = await api.fetchShop();
      setShopItems(shopData.map(mapApiShopItem));

      const lbData = await api.fetchLeaderboard();
      setLeaderboard(mapLeaderboard(lbData, telegramId, vkId));

      if (userData && userData.user) {
        // User exists in database
        setUserXP(userData.user.xp);
        setUserCoins(userData.user.coins);
        setUserName(userData.user.first_name || "Атлет");
        setTasks(mapApiTasks(userData.tasks));

        // Check if user needs to complete registration (no phone)
        if (!userData.user.phone) {
          console.log("User exists but needs to complete registration (no phone)");
          localStorage.removeItem("registration_completed");
          localStorage.removeItem("onboarding_completed");
          setIsRegistrationOpen(true);
        } else {
          // User is fully registered
          console.log("User is fully registered");
        }
      } else {
        // User not found in database - show registration
        console.log("User not found in database - showing registration");
        localStorage.removeItem("registration_completed");
        localStorage.removeItem("onboarding_completed");
        setIsRegistrationOpen(true);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setServerError(true);
      toast.error("Не удалось подключиться к серверу");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("Index: loadData effect triggered", { isReady, telegramId, vkId });
    loadData();
  }, [isReady, telegramId, vkId]);

  // --- Handle QR deep link from startParam ---
  useEffect(() => {
    if (!startParam || !tasks.length || (!telegramId && !vkId)) return;

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
          .completeTask(telegramId, task.dayNumber, "qr", qrCode, vkId)
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
              reloadLeaderboard();

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
  }, [startParam, tasks, telegramId, vkId]);

  // Tasks grouped by stage
  const stage1Tasks = tasks.filter((t) => t.stage === 1);
  const stage2Tasks = tasks.filter((t) => t.stage === 2);
  const stage3Tasks = tasks.filter((t) => t.stage === 3);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;

  // Check if stages are completed
  const isStage1Completed = stage1Tasks.length > 0 && stage1Tasks.every((t) => t.completed);
  const isStage2Completed = stage2Tasks.filter((t) => t.completed).length >= 3;

  // Auto-open blocks based on progress (after tasks are loaded)
  useEffect(() => {
    if (tasks.length === 0) return; // Wait for tasks to load

    // Auto-open stage 2 if stage 1 is completed
    if (isStage1Completed && !stage2Visible) {
      setStage2Visible(true);
    }

    // Auto-open stage 3 if stage 2 has 3+ completed tasks
    if (isStage2Completed && !stage3Visible) {
      setStage3Visible(true);
    }
  }, [tasks, isStage1Completed, isStage2Completed, stage2Visible, stage3Visible]);

  // Handlers for "Continue" buttons
  const handleShowStage2 = () => {
    setStage2Visible(true);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    // Scroll to stage 2
    setTimeout(() => {
      const element = document.querySelector(`[data-stage="2"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleShowStage3 = () => {
    setStage3Visible(true);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
    // Scroll to stage 3
    setTimeout(() => {
      const element = document.querySelector(`[data-stage="3"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
    if (!scanningTask || (!telegramId && !vkId)) return;
    setIsCodeChecking(true);

    try {
      const result = await api.completeTask(
        telegramId,
        scanningTask.dayNumber,
        scanningTask.verificationType,
        code,
        vkId
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
    if (!telegramId && !vkId) return;

    try {
      const result = await api.completeTask(
        telegramId,
        task.dayNumber,
        "self",
        undefined,
        vkId
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

        // Reload leaderboard to update ranking
        api.fetchLeaderboard().then(lbData => {
          setLeaderboard(mapLeaderboard(lbData, telegramId, vkId));
        });

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
    if (!selectedTask || (!telegramId && !vkId)) return;
    setIsSurveyLoading(true);

    try {
      const result = await api.submitSurvey(
        telegramId,
        selectedTask.dayNumber,
        answers,
        vkId
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
        reloadLeaderboard();
        reloadTasks();

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
    if (!selectedTask || (!telegramId && !vkId)) return;
    setIsAppCodeLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "app_code",
        code,
        vkId
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
    if (!selectedTask || (!telegramId && !vkId)) return;
    setIsReferralLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "referral_form",
        JSON.stringify(data),
        vkId
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

    // Если платформа не определена — сообщить пользователю
    if (!telegramId && !vkId) {
      console.error("❌ Registration failed: no platform ID (telegramId and vkId are both null)");
      toast.error("Откройте приложение через Telegram или VK");
      return;
    }

    // Save to backend
    try {
      const result = await api.submitRegistration(
        telegramId,
        data.fullName,
        data.phone,
        data.membership,
        lastName,
        username,
        vkId
      );

      if (result.success) {
        console.log("✅ Registration saved to database");
        // Update local user name
        setUserName(data.fullName.split(" ")[0] || "Атлет");

        // Save to localStorage
        localStorage.setItem("registration_completed", "true");
        localStorage.setItem("registration_data", JSON.stringify(data));

        // Close registration modal
        setIsRegistrationOpen(false);

        // Show onboarding only for brand-new users (not returning users found by phone)
        if (data.membership !== "existing") {
          setIsOnboardingOpen(true);
        }

        // Haptic feedback
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");

        // Reload data to get tasks and leaderboard
        await loadData();
      } else {
        console.error("❌ Registration failed:", result.error);
        toast.error(result.error || "Ошибка регистрации");
      }
    } catch (error) {
      console.error("❌ Registration network error:", error);
      toast.error("Ошибка сети. Попробуйте позже.");
    }
  };

  // Handle review screenshot submission (task 11 - Оставь отзыв)
  const handleReviewSubmit = async (file: File) => {
    if (!selectedTask || (!telegramId && !vkId)) return;

    const formData = new FormData();
    formData.append("photo", file);
    if (telegramId) formData.append("telegramId", String(telegramId));
    if (vkId) formData.append("vkId", String(vkId));
    formData.append("taskId", String(selectedTask.dayNumber));

    try {
      const res = await fetch("/api/upload-review", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) return;
    } catch {
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.dayNumber === selectedTask.dayNumber ? { ...t, reviewPending: true } : t
      )
    );
    setIsModalOpen(false);
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
  };

  // Handle quiz submission (task 14 - Пройди тест)
  const handleQuizSubmit = async (score: number) => {
    if (!selectedTask || (!telegramId && !vkId)) return;
    setIsQuizLoading(true);

    try {
      const result = await api.completeTask(
        telegramId,
        selectedTask.dayNumber,
        "quiz",
        JSON.stringify({ score }),
        vkId
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

  // Handle QR code scanned via native Telegram/VK scanner
  const handleQRScanned = async (scannedText: string) => {
    if (!scanningTask || (!telegramId && !vkId)) return;

    // Extract code from URL if QR contains a link (e.g. https://gsbot18.ru/qr.html?qr=TNT45)
    let code = scannedText;
    try {
      const url = new URL(scannedText);
      const qrParam = url.searchParams.get("qr");
      if (qrParam) code = qrParam;
    } catch {
      // Not a URL — use as-is
    }

    setIsQRModalOpen(false);
    setIsCodeChecking(true);

    try {
      const result = await api.completeTask(
        telegramId,
        scanningTask.dayNumber,
        scanningTask.verificationType,
        code,
        vkId
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

  const handleToggleCart = (id: string) => {
    setCart((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const loadMyPurchases = async () => {
    if (!telegramId && !vkId) return;
    setIsPurchasesLoading(true);
    try {
      const data = await api.fetchMyPurchases(telegramId, vkId);
      setMyPurchases(data);
    } catch {
      // silently fail
    } finally {
      setIsPurchasesLoading(false);
    }
  };

  const handlePayCart = async () => {
    if (!telegramId && !vkId) return;
    if (cart.length === 0) return;

    const cartTotal = cart.reduce((sum, id) => {
      const item = shopItems.find((i) => i.id === id);
      return sum + (item?.price || 0);
    }, 0);

    if (userCoins < cartTotal) {
      toast.error("Недостаточно монет");
      return;
    }

    setIsCartPaying(true);
    let successCount = 0;
    let lastCoins = userCoins;

    for (const id of cart) {
      try {
        const result = await api.purchaseItem(telegramId, Number(id), vkId);
        if (result.success) {
          successCount++;
          lastCoins = result.coins ?? lastCoins;
        }
      } catch {
        // continue with next item
      }
    }

    setUserCoins(lastCoins);
    setCart([]);
    setIsCartPaying(false);

    if (successCount > 0) {
      toast.success(`Куплено товаров: ${successCount}`);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
      loadMyPurchases();
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

  // User not found is now handled by showing registration modal

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
          {/* Stage 1: Warmup - Always visible */}
          {stage1Tasks.length > 0 && (
            <section className="px-4" data-stage="1">
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

          {/* Continue button for Stage 2 */}
          {!stage2Visible && stage2Tasks.length > 0 && (
            <div className="px-4 mt-6">
              <button
                onClick={handleShowStage2}
                disabled={!isStage1Completed}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                  isStage1Completed
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }`}
              >
                {isStage1Completed ? '🎯 Продолжить' : '🔒 Завершите все задания блока 1'}
              </button>
            </div>
          )}

          {/* Stage 2: Quest - Visible after button click */}
          {stage2Visible && stage2Tasks.length > 0 && (
            <section className="px-4 mt-6" data-stage="2">
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

          {/* Continue button for Stage 3 */}
          {stage2Visible && !stage3Visible && stage3Tasks.length > 0 && (
            <div className="px-4 mt-6">
              <button
                onClick={handleShowStage3}
                disabled={!isStage2Completed}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all ${
                  isStage2Completed
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }`}
              >
                {isStage2Completed ? '🏆 Продолжить' : '🔒 Завершите минимум 3 задания блока 2'}
              </button>
            </div>
          )}

          {/* Stage 3: Loyalty - Visible after button click */}
          {stage3Visible && stage3Tasks.length > 0 && (
            <section className="px-4 mt-6" data-stage="3">
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
                inCart={cart.includes(item.id)}
                onToggleCart={handleToggleCart}
              />
            ))}
          </div>

          {shopItems.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Магазин пока пуст
            </p>
          )}

          {/* Purchase history */}
          <div className="pt-2">
            <h3 className="mb-3 text-lg font-bold text-foreground">📋 История покупок</h3>
            {isPurchasesLoading ? (
              <p className="text-center text-muted-foreground py-4">Загрузка...</p>
            ) : myPurchases.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Покупок пока нет</p>
            ) : (
              <div className="space-y-2">
                {myPurchases.map((purchase, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{purchase.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(purchase.created_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-yellow-500">
                      -{purchase.price_paid} 🪙
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Cart bar */}
      {activeTab === "shop" && cart.length > 0 && (() => {
        const cartTotal = cart.reduce((sum, id) => {
          const item = shopItems.find((i) => i.id === id);
          return sum + (item?.price || 0);
        }, 0);
        const canAfford = userCoins >= cartTotal;
        return (
          <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
            <div className="flex items-center justify-between rounded-2xl bg-primary px-4 py-3 shadow-lg">
              <div>
                <p className="text-sm font-semibold text-primary-foreground">
                  {cart.length} {cart.length === 1 ? "товар" : cart.length < 5 ? "товара" : "товаров"}
                </p>
                <p className="text-xs text-primary-foreground/80">
                  Итого: {cartTotal} 🪙
                </p>
              </div>
              <button
                onClick={handlePayCart}
                disabled={isCartPaying || !canAfford}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  canAfford && !isCartPaying
                    ? "bg-white text-primary hover:bg-white/90"
                    : "bg-white/40 text-primary/50 cursor-not-allowed"
                }`}
              >
                {isCartPaying ? "Оплата..." : "Оплатить"}
              </button>
            </div>
          </div>
        );
      })()}

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScan={() => handleScan(selectedTask || undefined)}
        onComplete={() => {
          if (selectedTask) handleCompleteTask(selectedTask);
        }}
        onReviewSubmit={handleReviewSubmit}
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
        isLoading={isLoading}
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
