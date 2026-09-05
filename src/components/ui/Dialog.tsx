import { type ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}

export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className = "max-w-md",
}: DialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    return undefined;
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        visible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={onClose}
    >
      <div
        className={`dialog-panel mx-4 w-full ${className} rounded-xl border bg-card p-5 shadow-xl transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{title}</h3>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? (
          <div className="mt-5 flex justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
