import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

const SAMPLE_ORDER_ID = "U3Jlc3QtT3JkZXI6MQ==";

const clipboardWriteText = async (text: string): Promise<void> => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => Promise.resolve(text) },
  });
};

const TopNavShell = ({ orderId, disabled }: { orderId: string; disabled?: boolean }) => (
  <TopNav href="/orders" title="Order #1234">
    <OrderCopyLinkButton orderId={orderId} disabled={disabled} />
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
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await userEvent.hover(button);
    await expect(button).toHaveAttribute("title", "Copy order link");
  },
};

export const Focus: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await userEvent.tab();
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

export const Active: Story = {
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    fireEvent.mouseDown(button);
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
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
  play: async ({ canvasElement }) => {
    const button = getButton(canvasElement);

    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute("title", "Order link copied");
    });
  },
};

export const InTopNav: Story = {
  name: "TopNav placement",
  render: () => <TopNavShell orderId={SAMPLE_ORDER_ID} />,
};
