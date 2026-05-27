import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { useClipboard } from "@dashboard/hooks/useClipboard";
import { ClipboardCopyIcon } from "@dashboard/orders/components/OrderCardTitle/ClipboardCopyIcon";
import { getOrderShareableUrl } from "@dashboard/orders/urls";
import { Button } from "@saleor/macaw-ui-next";
import { useCallback } from "react";
import { useIntl } from "react-intl";

import { orderCopyLinkButtonMessages } from "./messages";
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

  const handleCopyLink = useCallback(() => {
    copy(getOrderShareableUrl(orderId));
  }, [copy, orderId]);

  const label = copied
    ? intl.formatMessage(orderCopyLinkButtonMessages.orderLinkCopied)
    : intl.formatMessage(orderCopyLinkButtonMessages.copyOrderLink);

  return (
    <Button
      className={styles.button}
      variant="secondary"
      disabled={disabled}
      icon={
        <ClipboardCopyIcon
          hasBeenClicked={copied}
          size={iconSize.medium}
          strokeWidth={iconStrokeWidthBySize.medium}
        />
      }
      onClick={handleCopyLink}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
    />
  );
};
