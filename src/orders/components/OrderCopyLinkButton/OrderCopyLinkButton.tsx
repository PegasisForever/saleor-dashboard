import { useClipboard } from "@dashboard/hooks/useClipboard";
import { useCallback } from "react";

import { OrderCopyLinkButtonContent } from "./OrderCopyLinkButtonContent";

interface OrderCopyLinkButtonProps {
  url?: string;
  disabled?: boolean;
}

export const OrderCopyLinkButton = ({
  url,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy, copyGeneration] = useClipboard();

  const handleCopy = useCallback(() => {
    copy(url ?? window.location.href);
  }, [copy, url]);

  return (
    <OrderCopyLinkButtonContent
      copied={copied}
      copyGeneration={copyGeneration}
      disabled={disabled}
      onCopy={handleCopy}
    />
  );
};
