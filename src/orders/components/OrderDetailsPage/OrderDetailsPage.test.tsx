import { shop } from "@dashboard/orders/fixtures";
import { OrderFixture } from "@dashboard/orders/fixtures/OrderFixture";
import { getAbsoluteOrderUrl } from "@dashboard/orders/urls";
import Wrapper from "@test/wrapper";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import OrderDetailsPage from "./OrderDetailsPage";

const mockCopy = jest.fn();

jest.mock("@dashboard/hooks/useClipboard", () => ({
  useClipboard: () => [false, mockCopy],
}));
jest.mock("@dashboard/hooks/useNavigator", () => () => jest.fn());
jest.mock("@dashboard/hooks/useBackLinkWithState", () => ({
  useBackLinkWithState: () => "/orders",
}));
jest.mock("@dashboard/components/DevModePanel/hooks", () => ({
  useDevModeContext: () => ({
    setDevModeContent: jest.fn(),
    setVariables: jest.fn(),
    setDevModeVisibility: jest.fn(),
  }),
}));
jest.mock("@dashboard/extensions/hooks/useExtensions", () => ({
  useExtensions: () => ({
    ORDER_DETAILS_MORE_ACTIONS: [],
    ORDER_DETAILS_WIDGETS: [],
  }),
}));
jest.mock("../OrderUnfulfilledProductsCard/OrderUnfulfilledProductsCard", () => ({
  OrderUnfulfilledProductsCard: () => null,
}));
jest.mock("../OrderFulfillmentCard/OrderFulfillmentCard", () => ({
  OrderFulfillmentCard: () => null,
}));
jest.mock("../OrderSummary/OrderSummary", () => ({
  OrderSummary: () => null,
}));
jest.mock("../OrderTransactionsSection/OrderTransactionsSection", () => ({
  OrderTransactionsSection: () => null,
}));
jest.mock("../OrderHistory", () => ({
  OrderHistory: () => null,
}));
jest.mock("../OrderCustomer", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../OrderChannelSectionCard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../OrderInvoiceList", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../OrderCustomerNote", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@dashboard/extensions/components/AppWidgets/AppWidgets", () => ({
  AppWidgets: () => null,
}));
jest.mock("../OrderLinePriceBreakdown/components/LinePriceWaterfallModal", () => ({
  LinePriceWaterfallModal: () => null,
}));
jest.mock("@dashboard/components/Savebar");

describe("OrderDetailsPage", () => {
  const order = OrderFixture.fulfilled().build();

  const defaultProps = {
    order,
    shop,
    loading: false,
    saveButtonBarState: "default" as const,
    errors: [],
    onBillingAddressEdit: jest.fn(),
    onFulfillmentApprove: jest.fn(),
    onFulfillmentCancel: jest.fn(),
    onFulfillmentTrackingNumberUpdate: jest.fn(),
    onNoteAdd: jest.fn(),
    onNoteUpdate: jest.fn(),
    onNoteUpdateLoading: false,
    onOrderCancel: jest.fn(),
    onOrderFulfill: jest.fn(),
    onPaymentCapture: jest.fn(),
    onPaymentRefund: jest.fn(),
    onPaymentVoid: jest.fn(),
    onShippingAddressEdit: jest.fn(),
    onProfileView: jest.fn(),
    onInvoiceClick: jest.fn(),
    onInvoiceGenerate: jest.fn(),
    onInvoiceSend: jest.fn(),
    onOrderReturn: jest.fn(),
    onTransactionAction: jest.fn(),
    onAddManualTransaction: jest.fn(),
    onOrderLineShowMetadata: jest.fn(),
    onOrderShowMetadata: jest.fn(),
    onFulfillmentShowMetadata: jest.fn(),
    onMarkAsPaid: jest.fn(),
    onRefundAdd: jest.fn(),
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders copy link button before metadata button and copies absolute order URL", () => {
    // Arrange
    render(
      <Wrapper>
        <MemoryRouter>
          <OrderDetailsPage {...defaultProps} />
        </MemoryRouter>
      </Wrapper>,
    );

    const copyButton = screen.getByTestId("copy-order-link");
    const metadataButton = screen.getByTestId("show-order-metadata");

    // Assert
    expect(copyButton).toBeInTheDocument();
    expect(
      copyButton.compareDocumentPosition(metadataButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // Act
    fireEvent.click(copyButton);

    // Assert
    const expectedUrl = getAbsoluteOrderUrl(order.id);

    expect(expectedUrl).not.toContain("?");
    expect(mockCopy).toHaveBeenCalledTimes(1);
    expect(mockCopy).toHaveBeenCalledWith(expectedUrl);
  });
});
