import { Box } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { useIntl } from "react-intl";

import { messages } from "./messages";
import { OrderCopyLinkButton } from "./OrderCopyLinkButton";
import storyStyles from "./OrderCopyLinkButton.stories.module.css";

const SAMPLE_ORDER_ID = "U2FyZ2Fy";

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  args: {
    orderId: SAMPLE_ORDER_ID,
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

const StoryWrapper = ({ children }: { children: ReactNode }) => <Box padding={4}>{children}</Box>;

export const Default: Story = {
  render: () => (
    <StoryWrapper>
      <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />
    </StoryWrapper>
  ),
};

export const Hover: Story = {
  render: () => (
    <StoryWrapper>
      <div className={storyStyles.storyHover}>
        <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />
      </div>
    </StoryWrapper>
  ),
};

export const Focus: Story = {
  render: () => (
    <StoryWrapper>
      <div className={storyStyles.storyFocus}>
        <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />
      </div>
    </StoryWrapper>
  ),
};

export const Active: Story = {
  render: () => (
    <StoryWrapper>
      <div className={storyStyles.storyActive}>
        <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />
      </div>
    </StoryWrapper>
  ),
};

export const Disabled: Story = {
  render: () => (
    <StoryWrapper>
      <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} disabled />
    </StoryWrapper>
  ),
};

export const Loading: Story = {
  render: () => (
    <StoryWrapper>
      <div className={storyStyles.storyLoading} aria-busy="true">
        <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} disabled />
      </div>
    </StoryWrapper>
  ),
};

const ErrorStoryContent = () => {
  const intl = useIntl();

  return (
    <div className={storyStyles.storyError}>
      <OrderCopyLinkButton orderId={SAMPLE_ORDER_ID} />
      <span className={storyStyles.storyErrorMessage} role="alert">
        {intl.formatMessage(messages.copyOrderLinkFailed)}
      </span>
    </div>
  );
};

export const Error: Story = {
  render: () => (
    <StoryWrapper>
      <ErrorStoryContent />
    </StoryWrapper>
  ),
};

export const Empty: Story = {
  render: () => (
    <StoryWrapper>
      <p className={storyStyles.storyEmpty}>No order selected — copy button is not rendered.</p>
    </StoryWrapper>
  ),
};
