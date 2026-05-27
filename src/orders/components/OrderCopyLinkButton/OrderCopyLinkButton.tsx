import { useClipboard } from "@dashboard/hooks/useClipboard";
import { Button } from "@saleor/macaw-ui-next";
import { useCallback } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { getOrderAbsoluteUrl } from "./getOrderAbsoluteUrl";
import { messages } from "./messages";
import styles from "./OrderCopyLinkButton.module.css";

interface OrderCopyLinkButtonProps {
  orderId: string;
  disabled?: boolean;
}

export const OrderCopyLinkButton = ({
  orderId,
  disabled = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const intl = useIntl();
  const [copied, copy] = useClipboard();
  const isDisabled = disabled || !orderId;

  const handleCopy = useCallback(() => {
    copy(getOrderAbsoluteUrl(orderId));
  }, [copy, orderId]);

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
    <Button
      variant="secondary"
      className={styles.button}
      icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
      onClick={handleCopy}
      disabled={isDisabled}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
    />
  );
};
