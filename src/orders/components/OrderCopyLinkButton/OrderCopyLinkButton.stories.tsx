import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { ClipboardCopyIcon } from "@dashboard/orders/components/OrderCardTitle/ClipboardCopyIcon";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryFn, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useIntl } from "react-intl";

import { orderCopyLinkButtonMessages } from "./messages";
import { OrderCopyLinkButton } from "./OrderCopyLinkButton";
import componentStyles from "./OrderCopyLinkButton.module.css";

const ORDER_ID = "T3JkZXI6MQ==";

const mockClipboard = () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    writable: true,
    value: {
      writeText: () => Promise.resolve(),
    },
  });
};

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  args: {
    orderId: ORDER_ID,
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story: StoryFn) => {
      mockClipboard();

      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;
type OrderCopyLinkButtonStoryArgs = ComponentProps<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  render: (args: OrderCopyLinkButtonStoryArgs) => (
    <div data-state="hover">
      <OrderCopyLinkButton {...args} />
    </div>
  ),
};

export const Focus: Story = {
  render: (args: OrderCopyLinkButtonStoryArgs) => (
    <div data-state="focus">
      <OrderCopyLinkButton {...args} />
    </div>
  ),
};

export const Active: Story = {
  render: (args: OrderCopyLinkButtonStoryArgs) => (
    <div data-state="active">
      <OrderCopyLinkButton {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/** Settled copied-state preview — same markup as production after successful copy. */
const OrderCopyLinkButtonCopiedPreview = (): JSX.Element => {
  const intl = useIntl();
  const label = intl.formatMessage(orderCopyLinkButtonMessages.orderLinkCopied);

  return (
    <Button
      className={componentStyles.button}
      variant="secondary"
      icon={
        <ClipboardCopyIcon
          hasBeenClicked
          size={iconSize.medium}
          strokeWidth={iconStrokeWidthBySize.medium}
        />
      }
      onClick={() => undefined}
      data-test-id="copy-order-link"
      title={label}
      aria-label={label}
      marginRight={3}
    />
  );
};

export const Copied: Story = {
  render: () => <OrderCopyLinkButtonCopiedPreview />,
};
