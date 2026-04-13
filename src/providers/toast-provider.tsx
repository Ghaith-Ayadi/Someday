import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from "react";

interface Toast {
    id: number;
    message: string;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
    toasts: [],
    addToast: () => {},
});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const nextId = useRef(0);

    const addToast = useCallback((message: string) => {
        const id = nextId.current++;
        setToasts((prev) => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 2000);
    }, []);

    return <ToastContext.Provider value={{ toasts, addToast }}>{children}</ToastContext.Provider>;
}
