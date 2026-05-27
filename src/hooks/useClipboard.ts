import { useEffect, useRef, useState } from "react";

export function useClipboard(): [boolean, (text: string) => void, number] {
  const [copied, setCopyStatus] = useState(false);
  const [copyGeneration, setCopyGeneration] = useState(0);
  const timeout = useRef<null | number>(null);
  const clear = () => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  };
  const copy = (text: string): void => {
    if (!navigator.clipboard?.writeText) {
      console.warn("Failed to use clipboard, ensure browser permission is enabled.");

      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        clear();
        setCopyStatus(true);
        setCopyGeneration(generation => generation + 1);

        timeout.current = window.setTimeout(() => {
          clear();
          setCopyStatus(false);
        }, 2000);
      })
      .catch(() => {
        console.warn("Failed to use clipboard, ensure browser permission is enabled.");
      });
  };

  // Clear timeout after hook unmounting
  useEffect(() => clear, []);

  return [copied, copy, copyGeneration];
}
