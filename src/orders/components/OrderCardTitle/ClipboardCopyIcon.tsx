import { sprinkles } from "@saleor/macaw-ui-next";
import { CheckIcon, CopyIcon } from "lucide-react";

interface ClipboardCopyIconProps {
  hasBeenClicked: boolean;
  size?: number;
  strokeWidth?: number;
}

export const ClipboardCopyIcon = ({
  hasBeenClicked,
  size = 16,
  strokeWidth,
}: ClipboardCopyIconProps): JSX.Element => {
  const className = sprinkles({ color: "default2" });

  return hasBeenClicked ? (
    <CheckIcon size={size} strokeWidth={strokeWidth} className={className} />
  ) : (
    <CopyIcon size={size} strokeWidth={strokeWidth} className={className} />
  );
};
