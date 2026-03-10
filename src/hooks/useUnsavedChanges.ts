import { useEffect, useRef, useCallback } from "react";
import { useBlocker } from "react-router-dom";
import { confirm } from "@/components/ui/confirm";

export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  options?: {
    onConfirm?: () => void;
    onCancel?: () => void;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  },
) {
  const {
    onConfirm,
    onCancel,
    title = "未保存的更改",
    message = "有未保存的更改，确定要离开吗？",
    confirmText = "离开",
    cancelText = "留下",
  } = options || {};
  const hasChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    hasChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChangesRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      confirm({
        title,
        message,
        confirmText,
        cancelText,
      }).then((confirmed) => {
        if (confirmed) {
          onConfirm?.();
          blocker.proceed();
        } else {
          onCancel?.();
          blocker.reset();
        }
      });
    }
  }, [blocker, title, message, confirmText, cancelText, onConfirm, onCancel]);

  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (hasChangesRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    },
    [message],
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [handleBeforeUnload]);

  return {
    isBlocked: blocker.state === "blocked",
    proceed: blocker.proceed,
    reset: blocker.reset,
  };
}
