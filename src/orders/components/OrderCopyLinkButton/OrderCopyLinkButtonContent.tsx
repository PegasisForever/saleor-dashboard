import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { messages } from "./messages";

interface OrderCopyLinkButtonContentProps {
  copied: boolean;
  disabled?: boolean;
  onCopy?: () => void;
}

export const OrderCopyLinkButtonContent = ({
  copied,
  disabled = false,
  onCopy,
}: OrderCopyLinkButtonContentProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  return (
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
  );
};
