import { type ReactNode, useEffect, useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  children?: ReactNode;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title = "确认",
  message,
  confirmText = "确认",
  cancelText = "取消",
  variant = "default",
  children,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleConfirm = () => {
    setVisible(false);
    setTimeout(onConfirm, 200);
  };

  const handleCancel = () => {
    setVisible(false);
    setTimeout(onCancel, 200);
  };

  const isDanger = variant === "danger";
  const iconColor = isDanger ? "text-red-500" : "text-yellow-500";
  const bgColor = isDanger ? "bg-red-500/10" : "bg-yellow-500/10";
  const btnColor = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : "bg-primary hover:opacity-90";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        visible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleCancel}
    >
      <div
        className={`mx-4 w-full max-w-sm rounded-xl border bg-card p-4 shadow-xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}
          >
            {isDanger ? (
              <ShieldAlert className={`h-5 w-5 ${iconColor}`} />
            ) : (
              <AlertTriangle className={`h-5 w-5 ${iconColor}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            {children && (
              <div className="mt-3">{children}</div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="rounded-lg border bg-secondary/50 px-4 py-2 text-sm font-medium transition-all hover:bg-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground transition-all ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
