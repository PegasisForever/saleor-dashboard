import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getOrderAbsoluteUrl } from "@dashboard/orders/utils/getOrderAbsoluteUrl";
import { Button } from "@saleor/macaw-ui-next";
import { useCallback } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { messages } from "./messages";

interface OrderCopyLinkButtonProps {
  orderId: string;
  disabled?: boolean;
}

export const OrderCopyLinkButton = ({
  orderId,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element | null => {
  const intl = useIntl();
  const [copied, copy] = useClipboard();

  const handleCopy = useCallback(() => {
    copy(getOrderAbsoluteUrl(orderId));
  }, [copy, orderId]);

  if (!orderId) {
    return null;
  }

  const label = intl.formatMessage(messages.copyOrderLink);

  return (
    <Button
      variant="secondary"
      disabled={disabled}
      icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
      onClick={handleCopy}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
    />
  );
};
