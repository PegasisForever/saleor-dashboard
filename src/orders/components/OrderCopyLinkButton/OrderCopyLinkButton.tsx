import { useClipboard } from "@dashboard/hooks/useClipboard";
import { getAbsoluteOrderUrl } from "@dashboard/orders/urls";
import { Button } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { orderCopyLinkMessages } from "./messages";

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

  const label = intl.formatMessage(
    copied ? orderCopyLinkMessages.linkCopied : orderCopyLinkMessages.copyOrderLink,
  );

  const handleCopy = (): void => {
    copy(getAbsoluteOrderUrl(orderId));
  };

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
