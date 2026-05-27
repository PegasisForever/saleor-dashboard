import { ClipboardCopyIcon } from "@dashboard/orders/components/OrderCardTitle/ClipboardCopyIcon";
import { Button } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { messages } from "./messages";

export interface OrderCopyLinkButtonViewProps {
  copied: boolean;
  disabled?: boolean;
  onCopy: () => void;
}

export const OrderCopyLinkButtonView = ({
  copied,
  disabled = false,
  onCopy,
}: OrderCopyLinkButtonViewProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

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
    />
  );
};
