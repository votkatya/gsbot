import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualInput: () => void;
}

export const QRScannerModal = ({ isOpen, onClose, onManualInput }: QRScannerModalProps) => {
  const handleOpenCamera = () => {
    // Create a file input that accepts images from camera
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment"; // Use rear camera
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Close this modal - the parent will handle the file
        const event = new CustomEvent("qr-image-captured", { detail: { file } });
        window.dispatchEvent(event);
        onClose();
      }
    };
    
    input.click();
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

              {/* Camera button */}
              <Button
                onClick={handleOpenCamera}
                className="mb-3 w-full gap-2"
                size="lg"
              >
                <Camera className="h-5 w-5" />
                Открыть камеру
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
                  Сфотографируйте QR-код и выберите изображение. Код будет проверен автоматически.
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
