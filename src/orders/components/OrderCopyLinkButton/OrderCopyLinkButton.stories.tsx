import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { userEvent, within } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

const SAMPLE_ORDER_ID = "T3JkZXI6MQ==";

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  args: {
    orderId: SAMPLE_ORDER_ID,
  },
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Copy order link" });

    await userEvent.hover(button);
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Copy order link" });

    button.focus();
  },
};

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Copy order link" });

    await userEvent.pointer({ keys: "[MouseLeft>]", target: button });
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Copied: Story = {
  play: async ({ canvasElement }) => {
    Object.assign(navigator, {
      clipboard: {
        writeText: async () => Promise.resolve(),
      },
    });

    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Copy order link" });

    await userEvent.click(button);
  },
};

export const InTopNav: Story = {
  render: args => (
    <TopNav href="/orders" title="Order #1234">
      <OrderCopyLinkButton {...args} />
      <Button
        variant="secondary"
        icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        data-test-id="show-order-metadata"
        title="Edit order metadata"
        marginRight={3}
      />
    </TopNav>
  ),
};
