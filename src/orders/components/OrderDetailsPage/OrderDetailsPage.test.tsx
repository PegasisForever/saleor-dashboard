import { type OrderDetailsQuery, WeightUnitsEnum } from "@dashboard/graphql";
import { OrderFixture } from "@dashboard/orders/fixtures/OrderFixture";
import Wrapper from "@test/wrapper";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import OrderDetailsPage from "./OrderDetailsPage";

const shop: OrderDetailsQuery["shop"] = {
  __typename: "Shop",
  defaultWeightUnit: WeightUnitsEnum.KG,
  fulfillmentAutoApprove: false,
  fulfillmentAllowUnpaid: true,
  countries: [],
  availablePaymentGateways: [],
};

jest.mock("@dashboard/components/Savebar");
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
jest.mock("../OrderLinePriceBreakdown/hooks/useOrderLinePriceWaterfall", () => ({
  useOrderLinePriceWaterfall: () => null,
}));
jest.mock("../OrderUnfulfilledProductsCard/OrderUnfulfilledProductsCard", () => ({
  OrderUnfulfilledProductsCard: () => <div data-test-id="order-unfulfilled-products" />,
}));
jest.mock("../OrderFulfillmentCard/OrderFulfillmentCard", () => ({
  OrderFulfillmentCard: () => <div data-test-id="order-fulfillment-card" />,
}));
jest.mock("../OrderSummary/OrderSummary", () => ({
  OrderSummary: () => <div data-test-id="order-summary" />,
}));
jest.mock("../OrderTransactionsSection/OrderTransactionsSection", () => ({
  OrderTransactionsSection: () => <div data-test-id="order-transactions" />,
}));
jest.mock("../OrderHistory", () => ({
  OrderHistory: () => <div data-test-id="order-history" />,
}));
jest.mock("../OrderCustomer/OrderCustomer", () => ({
  __esModule: true,
  default: () => <div data-test-id="order-customer" />,
}));
jest.mock("../OrderChannelSectionCard", () => ({
  __esModule: true,
  default: () => <div data-test-id="order-channel" />,
}));
jest.mock("../OrderInvoiceList", () => ({
  __esModule: true,
  default: () => <div data-test-id="order-invoices" />,
}));
jest.mock("../OrderCustomerNote", () => ({
  __esModule: true,
  default: () => <div data-test-id="order-customer-note" />,
}));
jest.mock("@dashboard/extensions/components/AppWidgets/AppWidgets", () => ({
  AppWidgets: () => <div data-test-id="app-widgets" />,
}));
jest.mock("./Title", () => ({
  __esModule: true,
  default: () => <div data-test-id="order-title" />,
}));

describe("OrderDetailsPage", () => {
  const order = OrderFixture.fulfilled().build();
  const noop = jest.fn();

  const defaultProps = {
    order,
    shop,
    loading: false,
    saveButtonBarState: "default" as const,
    errors: [],
    onBillingAddressEdit: noop,
    onFulfillmentApprove: noop,
    onFulfillmentCancel: noop,
    onFulfillmentTrackingNumberUpdate: noop,
    onNoteAdd: noop,
    onNoteUpdate: jest.fn().mockResolvedValue({}),
    onNoteUpdateLoading: false,
    onOrderCancel: noop,
    onOrderFulfill: noop,
    onPaymentCapture: noop,
    onPaymentRefund: noop,
    onPaymentVoid: noop,
    onShippingAddressEdit: noop,
    onProfileView: noop,
    onInvoiceClick: noop,
    onInvoiceGenerate: noop,
    onInvoiceSend: noop,
    onOrderReturn: noop,
    onOrderLineShowMetadata: noop,
    onOrderShowMetadata: noop,
    onFulfillmentShowMetadata: noop,
    onMarkAsPaid: noop,
    onTransactionAction: noop,
    onAddManualTransaction: noop,
    onRefundAdd: noop,
    onSubmit: jest.fn().mockResolvedValue({}),
  };

  it("renders copy-order-link button before show-order-metadata in TopNav", () => {
    // Arrange
    render(
      <Wrapper>
        <MemoryRouter>
          <OrderDetailsPage {...defaultProps} />
        </MemoryRouter>
      </Wrapper>,
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
