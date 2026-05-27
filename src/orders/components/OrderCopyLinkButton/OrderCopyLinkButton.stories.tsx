import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { fn } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";
import { OrderCopyLinkButtonContent } from "./OrderCopyLinkButtonContent";
import { OrderCopyLinkButtonStoryPreview } from "./OrderCopyLinkButtonStoryPreview";

const SAMPLE_ORDER_URL = "https://demo.saleor.io/dashboard/orders/T3JkZXI6MQ%3D%3D";

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  args: {
    url: SAMPLE_ORDER_URL,
  },
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  render: () => <OrderCopyLinkButtonStoryPreview interactionState="hover" />,
};

export const Focus: Story = {
  render: () => <OrderCopyLinkButtonStoryPreview interactionState="focus" />,
};

export const Active: Story = {
  render: () => <OrderCopyLinkButtonStoryPreview interactionState="active" />,
};

export const Disabled: Story = {
  render: () => <OrderCopyLinkButtonContent copied={false} disabled />,
};

export const Error: Story = {
  args: {
    url: SAMPLE_ORDER_URL,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Clipboard write failure leaves the button visually identical to Default (copy icon, "Copy order link"). No error affordance by design.',
      },
    },
  },
};

export const Copied: Story = {
  render: () => <OrderCopyLinkButtonContent copied />,
};

export const InOrderDetailsTopNav: Story = {
  render: () => (
    <TopNav href="/orders" title="Order #1234">
      <OrderCopyLinkButton url={SAMPLE_ORDER_URL} />
      <Button
        variant="secondary"
        icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        onClick={fn()}
        data-test-id="show-order-metadata"
        title="Edit order metadata"
        marginRight={3}
      />
    </TopNav>
  ),
};
