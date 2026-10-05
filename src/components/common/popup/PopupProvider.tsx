// Counsellor PopupProvider & Queue Manager - Member 4. Supports FR05, FR07, FR08, NFR01, NFR06.
// Centralizes all modal dialogs, non-stacking toast queues, and loading states into one accessible root.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Toast, ToastProps, ToastVariant } from "./Toast";
import { ConfirmDialog, ConfirmDialogProps } from "./ConfirmDialog";
import { LoadingOverlay } from "./LoadingOverlay";
import { PermissionPrompt, PermissionPromptProps } from "./PermissionPrompt";

export interface ToastOptions {
  variant?: ToastVariant;
  type?: ToastVariant;
  duration?: number;
  durationMs?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export type ToastPayload =
  | string
  | ({
      message: string;
    } & ToastOptions);

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  variant?: "default" | "destructive" | "warning" | "info";
  icon?: any;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface AlertOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  variant?: "default" | "warning" | "info" | "destructive";
  icon?: any;
  onDismiss?: () => void;
}

interface PopupContextValue {
  showToast: (
    messageOrOptions: ToastPayload,
    options?: ToastOptions | ToastVariant
  ) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions | string, message?: string) => Promise<void>;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  requestPermission: (type: "telehealth" | "notifications" | "calendar") => Promise<boolean>;
}

const PopupContext = createContext<PopupContextValue | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  // Toast Queue
  const [toastQueue, setToastQueue] = useState<ToastProps[]>([]);
  const [activeToast, setActiveToast] = useState<ToastProps | null>(null);

  // Dialog State
  const [dialogConfig, setDialogConfig] = useState<(ConfirmDialogProps & { resolve?: (val: boolean) => void }) | null>(null);

  // Loading Overlay State
  const [loadingConfig, setLoadingConfig] = useState<{ visible: boolean; message?: string }>({
    visible: false,
  });

  // Permission Prompt State
  const [permissionConfig, setPermissionConfig] = useState<{
    visible: boolean;
    type: "telehealth" | "notifications" | "calendar";
    resolve?: (granted: boolean) => void;
  } | null>(null);

  // Process next toast in queue
  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      const next = toastQueue[0];
      setActiveToast(next);
      setToastQueue((prev) => prev.slice(1));
    }
  }, [activeToast, toastQueue]);

  const handleDismissActiveToast = useCallback((id: string) => {
    setActiveToast(null);
  }, []);

  const showToast = useCallback(
    (
      messageOrOptions: ToastPayload,
      options?: ToastOptions | ToastVariant
    ) => {
      let message = "";
      let variant: ToastVariant = "success";
      let duration: number | undefined;
      let action: { label: string; onPress: () => void } | undefined;

      if (typeof messageOrOptions === "string") {
        message = messageOrOptions;
        if (typeof options === "string") {
          variant = options;
        } else if (typeof options === "object") {
          variant = options.variant || options.type || "success";
          duration = options.duration || options.durationMs;
          action = options.action;
        }
      } else if (messageOrOptions && typeof messageOrOptions === "object") {
        message = messageOrOptions.message;
        variant = messageOrOptions.variant || messageOrOptions.type || "success";
        duration = messageOrOptions.duration || messageOrOptions.durationMs;
        action = messageOrOptions.action;
      }

      const newToast: ToastProps = {
        id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        message,
        variant,
        duration,
        action,
        onDismiss: handleDismissActiveToast,
      };

      setToastQueue((prev) => [...prev, newToast]);
    },
    [handleDismissActiveToast]
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogConfig({
        visible: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        isDestructive: options.isDestructive,
        variant: options.variant,
        icon: options.icon,
        onConfirm: () => {
          setDialogConfig(null);
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setDialogConfig(null);
          if (options.onCancel) options.onCancel();
          resolve(false);
        },
        resolve,
      });
    });
  }, []);

  const alert = useCallback((optionsOrTitle: AlertOptions | string, message?: string): Promise<void> => {
    return new Promise((resolve) => {
      const title = typeof optionsOrTitle === "string" ? optionsOrTitle : optionsOrTitle.title;
      const msg = typeof optionsOrTitle === "string" ? message : optionsOrTitle.message;
      const confirmLabel = typeof optionsOrTitle === "object" ? optionsOrTitle.confirmLabel || "Got It" : "Got It";
      const variant = typeof optionsOrTitle === "object" ? optionsOrTitle.variant || "info" : "info";
      const icon = typeof optionsOrTitle === "object" ? optionsOrTitle.icon : undefined;

      setDialogConfig({
        visible: true,
        title,
        message: msg,
        confirmLabel,
        cancelLabel: undefined,
        variant,
        icon,
        onConfirm: () => {
          setDialogConfig(null);
          if (typeof optionsOrTitle === "object" && optionsOrTitle.onDismiss) {
            optionsOrTitle.onDismiss();
          }
          resolve();
        },
        onCancel: () => {
          setDialogConfig(null);
          resolve();
        },
      });
    });
  }, []);

  const showLoading = useCallback((message?: string) => {
    setLoadingConfig({ visible: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingConfig({ visible: false });
  }, []);

  const requestPermission = useCallback((type: "telehealth" | "notifications" | "calendar"): Promise<boolean> => {
    return new Promise((resolve) => {
      setPermissionConfig({
        visible: true,
        type,
        resolve,
      });
    });
  }, []);

  return (
    <PopupContext.Provider
      value={{
        showToast,
        confirm,
        alert,
        showLoading,
        hideLoading,
        requestPermission,
      }}
    >
      {children}

      {/* ─── Active Floating Toast Container (Top Anchored) ─── */}
      {activeToast ? (
        <View style={styles.floatingToastHost} pointerEvents="box-none">
          <Toast {...activeToast} />
        </View>
      ) : null}

      {/* ─── Active Confirm / Alert Dialog ─── */}
      {dialogConfig ? <ConfirmDialog {...dialogConfig} /> : null}

      {/* ─── Active Loading Overlay ─── */}
      <LoadingOverlay
        visible={loadingConfig.visible}
        message={loadingConfig.message}
        onTimeout={hideLoading}
      />

      {/* ─── Active Permission Prompt ─── */}
      {permissionConfig ? (
        <PermissionPrompt
          visible={permissionConfig.visible}
          type={permissionConfig.type}
          onAllow={() => {
            const r = permissionConfig.resolve;
            setPermissionConfig(null);
            if (r) r(true);
          }}
          onDismiss={() => {
            const r = permissionConfig.resolve;
            setPermissionConfig(null);
            if (r) r(false);
          }}
        />
      ) : null}
    </PopupContext.Provider>
  );
}

export function usePopup(): PopupContextValue {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  floatingToastHost: {
    position: "absolute",
    top: 54,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 99999,
  },
});
