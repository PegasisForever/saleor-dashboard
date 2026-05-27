import { mockResizeObserver } from "@dashboard/components/Datagrid/testUtils";
import { SavebarRefProvider } from "@dashboard/components/Savebar/SavebarRefContext";
import { type OrderDetailsFragment } from "@dashboard/graphql";
import { useClipboard } from "@dashboard/hooks/useClipboard";
import { order as orderFixture, shop } from "@dashboard/orders/fixtures";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import OrderDetailsPage from "./OrderDetailsPage";

jest.mock("@dashboard/hooks/useNavigator", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

jest.mock("@dashboard/extensions/hooks/useExtensions", () => ({
  useExtensions: jest.fn(() => ({
    ORDER_DETAILS_MORE_ACTIONS: [],
    ORDER_DETAILS_WIDGETS: [],
  })),
}));

jest.mock("@dashboard/components/DevModePanel/hooks", () => ({
  useDevModeContext: jest.fn(() => ({
    variables: "",
    setVariables: jest.fn(),
    isDevModeVisible: false,
    setDevModeVisibility: jest.fn(),
    devModeContent: "",
    setDevModeContent: jest.fn(),
  })),
}));

jest.mock("@dashboard/hooks/useClipboard");

mockResizeObserver();

const mockUseClipboard = useClipboard as jest.MockedFunction<typeof useClipboard>;

const RouterWrapper = ({ children }: { children: ReactNode }) => (
  <Wrapper>
    <MemoryRouter>
      <SavebarRefProvider>{children}</SavebarRefProvider>
    </MemoryRouter>
  </Wrapper>
);

const order = orderFixture("--placeholder--") as OrderDetailsFragment;

const defaultProps = {
  order,
  shop,
  loading: false,
  saveButtonBarState: "default" as const,
  errors: [],
  onBillingAddressEdit: jest.fn(),
  onFulfillmentApprove: jest.fn(),
  onFulfillmentCancel: jest.fn(),
  onOrderLineShowMetadata: jest.fn(),
  onOrderShowMetadata: jest.fn(),
  onFulfillmentShowMetadata: jest.fn(),
  onFulfillmentTrackingNumberUpdate: jest.fn(),
  onOrderFulfill: jest.fn(),
  onPaymentCapture: jest.fn(),
  onMarkAsPaid: jest.fn(),
  onPaymentRefund: jest.fn(),
  onPaymentVoid: jest.fn(),
  onShippingAddressEdit: jest.fn(),
  onOrderCancel: jest.fn(),
  onNoteAdd: jest.fn(),
  onNoteUpdate: jest.fn().mockResolvedValue({}),
  onNoteUpdateLoading: false,
  onProfileView: jest.fn(),
  onOrderReturn: jest.fn(),
  onInvoiceClick: jest.fn(),
  onInvoiceGenerate: jest.fn(),
  onInvoiceSend: jest.fn(),
  onTransactionAction: jest.fn(),
  onAddManualTransaction: jest.fn(),
  onRefundAdd: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue({}),
};

describe("OrderDetailsPage", () => {
  beforeEach(() => {
    mockUseClipboard.mockReturnValue([false, jest.fn()]);
  });

  it("renders copy-order-link immediately before show-order-metadata in TopNav", () => {
    // Arrange
    render(
      <RouterWrapper>
        <OrderDetailsPage {...defaultProps} />
      </RouterWrapper>,
    );

    // Act
    const copyButton = screen.getByTestId("copy-order-link");
    const metadataButton = screen.getByTestId("show-order-metadata");

    // Assert
    expect(copyButton).toBeInTheDocument();
    expect(metadataButton).toBeInTheDocument();
    expect(
      copyButton.compareDocumentPosition(metadataButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
