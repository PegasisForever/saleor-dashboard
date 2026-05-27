import { ClipboardCopyIcon } from "@dashboard/orders/components/OrderCardTitle/ClipboardCopyIcon";
import { Button } from "@saleor/macaw-ui-next";
import clsx from "clsx";
import { useIntl } from "react-intl";

import { messages } from "./messages";
import styles from "./OrderCopyLinkButton.module.css";

export type OrderCopyLinkButtonPreviewState = "hover" | "active";

export interface OrderCopyLinkButtonViewProps {
  copied: boolean;
  disabled?: boolean;
  onCopy: () => void;
  /** Storybook-only visual state simulation; not used in production TopNav integration. */
  previewState?: OrderCopyLinkButtonPreviewState;
}

export const OrderCopyLinkButtonView = ({
  copied,
  disabled = false,
  onCopy,
  previewState,
}: OrderCopyLinkButtonViewProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  const previewClassName =
    previewState === "hover"
      ? styles.previewHover
      : previewState === "active"
        ? styles.previewActive
        : undefined;

  return (
    <Button
      variant="secondary"
      icon={<ClipboardCopyIcon hasBeenClicked={copied} />}
      onClick={onCopy}
      disabled={disabled}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
      className={clsx(previewClassName)}
    />
  );
};
