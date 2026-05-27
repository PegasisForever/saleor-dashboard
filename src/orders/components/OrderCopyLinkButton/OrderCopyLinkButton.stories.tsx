import { type UserContext as UserContextType } from "@dashboard/auth/types";
import { UserContext } from "@dashboard/auth/useUser";
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import { type UserFragment } from "@dashboard/graphql";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import { type ComponentType } from "react";
import { expect, fn, within } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";
import { OrderCopyLinkButtonView } from "./OrderCopyLinkButtonView";

const mockOrderId = "T3JkZXI6MQ==";

const mockUser: UserFragment = {
  __typename: "User",
  id: "user-1",
  email: "admin@example.com",
  firstName: "Admin",
  lastName: "User",
  isStaff: true,
  dateJoined: "2024-01-01T00:00:00Z",
  metadata: [],
  userPermissions: [],
  avatar: null,
  accessibleChannels: [],
  restrictedAccessToChannels: false,
};

const mockUserContext: UserContextType = {
  login: undefined,
  loginByExternalPlugin: undefined,
  logout: undefined,
  requestLoginByExternalPlugin: undefined,
  authenticating: false,
  isCredentialsLogin: false,
  authenticated: true,
  errors: [],
  refetchUser: undefined,
  user: mockUser,
};

const TopNavDecorator = (Story: ComponentType) => (
  <UserContext.Provider value={mockUserContext}>
    <TopNav href="/orders" title="Order #42">
      <Story />
      <Button
        variant="secondary"
        icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        onClick={fn()}
        data-test-id="show-order-metadata"
        title="Edit order metadata"
        marginRight={3}
      />
      <TopNav.Menu
        items={[
          { label: "Open in GraphiQL", onSelect: fn() },
          { label: "Cancel order", onSelect: fn(), color: "critical1" },
        ]}
      />
    </TopNav>
  </UserContext.Provider>
);

const getCopyButton = (canvasElement: HTMLElement): HTMLElement => {
  const canvas = within(canvasElement);

  return canvas.getByTestId("copy-order-link");
};

const meta: Meta<typeof OrderCopyLinkButton> = {
  title: "Orders/OrderCopyLinkButton",
  component: OrderCopyLinkButton,
  decorators: [TopNavDecorator],
  args: {
    orderId: mockOrderId,
  },
};

export default meta;
type Story = StoryObj<typeof OrderCopyLinkButton>;

export const Default: Story = {};

export const Hover: Story = {
  render: () => <OrderCopyLinkButtonView copied={false} onCopy={fn()} previewState="hover" />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Arrange
    const button = getCopyButton(canvasElement);

    // Assert
    await expect(button).toHaveAttribute("aria-label", "Copy order link");
  },
};

export const Focus: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Arrange
    const button = getCopyButton(canvasElement);

    // Act
    button.focus();

    // Assert
    await expect(button).toHaveFocus();
  },
};

export const Active: Story = {
  render: () => <OrderCopyLinkButtonView copied={false} onCopy={fn()} previewState="active" />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Arrange
    const button = getCopyButton(canvasElement);

    // Assert
    await expect(button).toHaveAttribute("aria-label", "Copy order link");
  },
};

export const Disabled: Story = {
  render: () => <OrderCopyLinkButtonView copied={false} disabled onCopy={fn()} />,
};

export const Copied: Story = {
  render: () => <OrderCopyLinkButtonView copied onCopy={fn()} />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Arrange
    const button = getCopyButton(canvasElement);

    // Assert
    await expect(button).toHaveAttribute("aria-label", "Order link copied");
  },
};
