import { useClipboard } from "@dashboard/hooks/useClipboard";
import { Button } from "@saleor/macaw-ui-next";
import clsx from "clsx";
import { useCallback } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { getShareableOrderUrl } from "./getShareableOrderUrl";
import { orderCopyLinkButtonMessages as messages } from "./messages";
import styles from "./OrderCopyLinkButton.module.css";

interface OrderCopyLinkButtonProps {
  orderId: string;
  disabled?: boolean;
  forceCopied?: boolean;
  forceHovered?: boolean;
  forceActive?: boolean;
  forceFocused?: boolean;
}

export const OrderCopyLinkButton = ({
  orderId,
  disabled = false,
  forceCopied = false,
  forceHovered = false,
  forceActive = false,
  forceFocused = false,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const intl = useIntl();
  const [copied, copy] = useClipboard();

  const handleCopy = useCallback((): void => {
    copy(getShareableOrderUrl(orderId));
  }, [copy, orderId]);

  const isCopied = forceCopied || copied;

  const label = isCopied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
    <Button
      variant="secondary"
      disabled={disabled}
      className={clsx(
        styles.button,
        forceHovered && styles.buttonForceHover,
        forceActive && styles.buttonForceActive,
        forceFocused && styles.buttonForceFocus,
      )}
      icon={<ClipboardCopyIcon hasBeenClicked={isCopied} />}
      onClick={handleCopy}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
    />
  );
};
