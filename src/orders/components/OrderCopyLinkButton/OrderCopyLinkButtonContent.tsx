import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import { type CSSProperties } from "react";
import { useIntl } from "react-intl";

import { ClipboardCopyIcon } from "../OrderCardTitle/ClipboardCopyIcon";
import { messages } from "./messages";

export type OrderCopyLinkButtonInteractionPreview = "hover" | "focus" | "active";

interface OrderCopyLinkButtonContentProps {
  copied: boolean;
  disabled?: boolean;
  onCopy?: () => void;
  interactionPreview?: OrderCopyLinkButtonInteractionPreview;
}

const interactionPreviewStyle: Record<OrderCopyLinkButtonInteractionPreview, CSSProperties> = {
  hover: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    boxShadow: "none",
  },
  focus: {
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "rgba(19, 32, 48, 0.16) 0px 1px 1px 0px",
    outline: "2px solid rgb(37, 40, 40)",
    outlineOffset: "2px",
  },
  active: {
    backgroundColor: "rgba(0, 0, 0, 0.16)",
    boxShadow: "none",
  },
};

export const OrderCopyLinkButtonContent = ({
  copied,
  disabled = false,
  onCopy,
  interactionPreview,
}: OrderCopyLinkButtonContentProps): JSX.Element => {
  const intl = useIntl();

  const label = copied
    ? intl.formatMessage(messages.orderLinkCopied)
    : intl.formatMessage(messages.copyOrderLink);

  const previewStyle: CSSProperties | undefined = interactionPreview
    ? interactionPreviewStyle[interactionPreview]
    : undefined;

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
      style={previewStyle}
    />
  );
};
