import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import { Fragment } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { messages } from "./messages";
import styles from "./OrderCopyLinkButtonContent.module.css";

interface OrderCopyLinkButtonContentProps {
  copied: boolean;
  copyGeneration?: number;
  disabled?: boolean;
  onCopy?: () => void;
}

export const OrderCopyLinkButtonContent = ({
  copied,
  copyGeneration = 0,
  disabled = false,
  onCopy,
}: OrderCopyLinkButtonContentProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
    <Fragment>
      <Button
        variant="secondary"
        disabled={disabled}
        icon={
          <ClipboardCopyIcon
            hasBeenClicked={copied}
            size={iconSize.medium}
            strokeWidth={iconStrokeWidth}
          />
        }
        onClick={onCopy}
        data-test-id="copy-order-link"
        title={label}
        aria-label={label}
        marginRight={3}
      />
      {copied ? (
        <span key={copyGeneration} aria-live="polite" className={styles.visuallyHidden}>
          {intl.formatMessage(messages.orderLinkCopied)}
        </span>
      ) : null}
    </Fragment>
  );
};
