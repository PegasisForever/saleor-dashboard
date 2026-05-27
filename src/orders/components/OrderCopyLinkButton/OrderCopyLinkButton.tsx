import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getShareableOrderUrl } from "@dashboard/orders/utils/getShareableOrderUrl";
import { useCallback } from "react";

import { OrderCopyLinkButtonView } from "./OrderCopyLinkButtonView";

export interface OrderCopyLinkButtonProps {
  orderId: string;
}

export const OrderCopyLinkButton = ({ orderId }: OrderCopyLinkButtonProps): JSX.Element => {
  const [copied, copy] = useClipboard();
  const disabled = !orderId;

  const handleCopy = useCallback(() => {
    if (disabled) {
      return;
    }

    copy(getShareableOrderUrl(orderId));
  }, [copy, disabled, orderId]);

  return <OrderCopyLinkButtonView copied={copied} disabled={disabled} onCopy={handleCopy} />;
};
