import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

const ORDER_ID = "T3JkZXI6MQ==";

const mockClipboard = () => {
  Object.assign(navigator, {
    clipboard: {
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
    Story => {
      mockClipboard();

      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /copy order link/i });

    await userEvent.hover(button);
  },
};

export const Focus: Story = {
  play: async () => {
    await userEvent.tab();
  },
};

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /copy order link/i });

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
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /copy order link/i });

    await userEvent.click(button);
  },
};
