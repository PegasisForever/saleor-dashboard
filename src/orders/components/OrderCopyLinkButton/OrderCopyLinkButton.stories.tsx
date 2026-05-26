import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { Button, vars } from "@saleor/macaw-ui-next";
import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { userEvent, within } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

const STORY_STATE_CLASS = {
  hover: "order-copy-link-story-hover",
  active: "order-copy-link-story-active",
} as const;

/**
 * Storybook cannot persist :hover / :active pseudo-classes after play functions
 * complete. These decorators apply macaw secondary-button state tokens so
 * settled Storybook renders match production interaction styling.
 */
const createStateDecorator = (state: keyof typeof STORY_STATE_CLASS): Decorator => {
  const className = STORY_STATE_CLASS[state];
  const backgroundColor =
    state === "hover"
      ? vars.colors.background.default1Hovered
      : vars.colors.background.default1Pressed;

  const StateDecorator: Decorator = Story => (
    <>
      <style>{`
        .${className} [data-test-id="copy-order-link"] {
          background-color: ${backgroundColor} !important;
        }
      `}</style>
      <div className={className}>
        <Story />
      </div>
    </>
  );

  StateDecorator.displayName = `OrderCopyLinkButton${state}Decorator`;

  return StateDecorator;
};

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
  decorators: [createStateDecorator("hover")],
};

export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Copy order link" });

    button.focus();
  },
};

export const Active: Story = {
  decorators: [createStateDecorator("active")],
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
