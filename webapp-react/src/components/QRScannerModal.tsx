import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualInput: () => void;
  onQRScanned?: (code: string) => void;
}

export const QRScannerModal = ({ isOpen, onClose, onManualInput, onQRScanned }: QRScannerModalProps) => {

  const isTelegramScanAvailable = () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg || !tg.showScanQrPopup) return false;
      // showScanQrPopup is available since Bot API 6.4
      const version = parseFloat(tg.version || "0");
      return version >= 6.4;
    } catch {
      return false;
    }
  };

  const handleOpenCamera = () => {
    if (isTelegramScanAvailable()) {
      // Use native Telegram QR scanner
      const tg = window.Telegram.WebApp;
      tg.showScanQrPopup(
        { text: "Наведите камеру на QR-код в зоне клуба" },
        (scannedText: string) => {
          // Return true to close the popup
          tg.closeScanQrPopup();
          if (scannedText && onQRScanned) {
            onQRScanned(scannedText);
          }
          onClose();
          return true;
        }
      );
    } else {
      // Fallback: open manual input directly
      onManualInput();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-4 bottom-4 z-[60] flex items-center justify-center overflow-y-auto py-4"
          >
            <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-xl relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                <QrCode className="h-10 w-10 text-primary" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-foreground">
                Сканирование QR-кода
              </h2>
              <p className="mb-6 text-muted-foreground">
                Откройте камеру и наведите её на QR-код в зоне клуба
              </p>

              {/* Camera button - triggers native Telegram scanner */}
              <Button
                onClick={handleOpenCamera}
                className="mb-3 w-full gap-2"
                size="lg"
              >
                <Camera className="h-5 w-5" />
                Сканировать QR-код
              </Button>

              {/* Manual input option */}
              <button
                onClick={onManualInput}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                Ввести код вручную
              </button>

              {/* Info */}
              <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-left text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Наведите камеру на QR-код. Код будет считан и проверен автоматически.
                </span>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
