import { AnimatePresence, motion } from "motion/react";
import { useToast } from "@/providers/toast-provider";

export function ToastContainer() {
    const { toasts } = useToast();

    return (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 16, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-auto rounded-lg bg-primary-solid px-4 py-2.5 text-sm font-medium text-white shadow-lg"
                    >
                        {toast.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
