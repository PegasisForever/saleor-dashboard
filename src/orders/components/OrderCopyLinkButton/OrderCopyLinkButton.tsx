import { useClipboard } from "@dashboard/hooks/useClipboard";
import { Button } from "@saleor/macaw-ui-next";
import clsx from "clsx";
import { useCallback } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { getOrderAbsoluteUrl } from "./getOrderAbsoluteUrl";
import { messages } from "./messages";
import styles from "./OrderCopyLinkButton.module.css";

export type OrderCopyLinkButtonPreviewState = "hover" | "focus" | "active" | "copied";

interface OrderCopyLinkButtonProps {
  orderId: string;
  disabled?: boolean;
  /** Storybook-only: renders a static visual state without user interaction. */
  previewState?: OrderCopyLinkButtonPreviewState;
}

export const OrderCopyLinkButton = ({
  orderId,
  disabled = false,
  previewState,
}: OrderCopyLinkButtonProps): JSX.Element => {
  const intl = useIntl();
  const [copiedFromClipboard, copy] = useClipboard();
  const isDisabled = disabled || !orderId;
  const copied = previewState === "copied" || copiedFromClipboard;

  const handleCopy = useCallback(() => {
    copy(getOrderAbsoluteUrl(orderId));
  }, [copy, orderId]);

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  const buttonClassName = clsx(
    styles.button,
    previewState === "hover" && styles.buttonPreviewHover,
    previewState === "focus" && styles.buttonPreviewFocus,
    previewState === "active" && styles.buttonPreviewActive,
  );

  return (
    <Button
      variant="secondary"
      className={buttonClassName}
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
