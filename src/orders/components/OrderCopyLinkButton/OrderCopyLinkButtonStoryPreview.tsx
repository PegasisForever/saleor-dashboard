import styles from "./OrderCopyLinkButton.stories.module.css";
import { OrderCopyLinkButtonContent } from "./OrderCopyLinkButtonContent";

export type OrderCopyLinkButtonStoryInteractionState = "hover" | "focus" | "active";

interface OrderCopyLinkButtonStoryPreviewProps {
  copied?: boolean;
  disabled?: boolean;
  interactionState?: OrderCopyLinkButtonStoryInteractionState;
}

const interactionStateClassName: Record<
  OrderCopyLinkButtonStoryInteractionState,
  string | undefined
> = {
  hover: styles.storyHover,
  focus: styles.storyFocus,
  active: styles.storyActive,
};

export const OrderCopyLinkButtonStoryPreview = ({
  copied = false,
  disabled = false,
  interactionState,
}: OrderCopyLinkButtonStoryPreviewProps): JSX.Element => {
  const wrapperClassName = interactionState
    ? interactionStateClassName[interactionState]
    : undefined;

  return (
    <div className={wrapperClassName}>
      <OrderCopyLinkButtonContent copied={copied} disabled={disabled} />
    </div>
  );
};
