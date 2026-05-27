import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { expect, within } from "storybook/test";

import { OrderCopyLinkButton, type OrderCopyLinkButtonPreviewState } from "./OrderCopyLinkButton";

const SAMPLE_ORDER_ID = "U3Jlc3QtT3JkZXI6MQ==";

const clipboardWriteText = async (text: string): Promise<void> => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => Promise.resolve(text) },
  });
};

interface TopNavShellProps {
  orderId: string;
  disabled?: boolean;
  previewState?: OrderCopyLinkButtonPreviewState;
}

const TopNavShell = ({ orderId, disabled, previewState }: TopNavShellProps) => (
  <TopNav href="/orders" title="Order #1234">
    <OrderCopyLinkButton orderId={orderId} disabled={disabled} previewState={previewState} />
    <Button
      variant="secondary"
      icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
      data-test-id="show-order-metadata"
      title="Edit order metadata"
      marginRight={3}
    />
  </TopNav>
);

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  parameters: {
    layout: "fullscreen",
  },
  beforeEach: async () => {
    await clipboardWriteText("");
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

const getButton = (canvasElement: HTMLElement) =>
  within(canvasElement).getByTestId("copy-order-link");

export const Default: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
};

export const Hover: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="hover" />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await expect(button).toHaveAttribute("title", "Copy order link");
  },
};

export const Focus: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="focus" />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await expect(button).toHaveAttribute("title", "Copy order link");
  },
};

export const Active: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="active" />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await expect(button).toBeVisible();
  },
};

export const Disabled: Story = {
  render: () => <TopNavShell orderId="" disabled />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await expect(button).toBeDisabled();
  },
};

export const Copied: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} previewState="copied" />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await expect(button).toHaveAttribute("title", "Order link copied");
    await expect(button).toHaveAttribute("aria-label", "Order link copied");
  },
};
