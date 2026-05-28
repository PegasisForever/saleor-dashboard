import type { UserContext as UserContextType } from "@dashboard/auth/types";
import { UserContext } from "@dashboard/auth/useUser";
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { iconSize, iconStrokeWidth } from "@dashboard/components/icons";
import type { UserFragment } from "@dashboard/graphql";
import { Button } from "@saleor/macaw-ui-next";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Code } from "lucide-react";
import type { ComponentType } from "react";
import { fn } from "storybook/test";

import { OrderCopyLinkButton } from "./OrderCopyLinkButton";

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

export const InOrderDetailsTopNav: Story = {
  decorators: [
    (Story: ComponentType) => (
      <UserContext.Provider value={mockUserContext}>
        <Story />
      </UserContext.Provider>
    ),
  ],
  render: () => (
    <TopNav title="Order #1234" href="/orders">
      <OrderCopyLinkButton orderId="T3JkZXI6MQ==" />
      <Button
        variant="secondary"
        icon={<Code size={iconSize.medium} strokeWidth={iconStrokeWidth} />}
        onClick={fn()}
        data-test-id="show-order-metadata"
        title="Edit order metadata"
        marginRight={3}
      />
      <TopNav.Menu
        dataTestId="menu"
        items={[
          { label: "Open GraphiQL", onSelect: fn() },
          { label: "Cancel order", onSelect: fn(), color: "critical1" },
        ]}
      />
    </TopNav>
  ),
  parameters: {
    viewport: { defaultViewport: "desktop" },
  },
};

export const InOrderDetailsTopNavNarrow: Story = {
  ...InOrderDetailsTopNav,
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};
