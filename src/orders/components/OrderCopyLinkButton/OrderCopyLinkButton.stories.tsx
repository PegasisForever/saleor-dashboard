import type { Meta, StoryObj } from "@storybook/react-vite";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  args: {
    orderId: "T3JkZXI6MQ==",
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  args: {
    forceHovered: true,
  },
};

export const Focus: Story = {
  args: {
    forceFocused: true,
  },
};

export const Active: Story = {
  args: {
    forceActive: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Copied: Story = {
  args: {
    forceCopied: true,
  },
};
