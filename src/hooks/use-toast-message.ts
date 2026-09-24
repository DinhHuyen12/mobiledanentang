"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function useToastMessage(
  message: string,
  type: "success" | "error" | "" = "error"
) {
  const lastShownMessage = useRef("");

  useEffect(() => {
    if (!message) {
      lastShownMessage.current = "";
      return;
    }

    const toastKey = `${type}:${message}`;

    if (lastShownMessage.current === toastKey) {
      return;
    }

    lastShownMessage.current = toastKey;

    if (type === "success") {
      toast.success(message);
      return;
    }

    toast.error(message);
  }, [message, type]);
}
