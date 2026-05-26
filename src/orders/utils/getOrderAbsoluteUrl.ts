import { orderPath } from "@dashboard/orders/urls";
import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import urlJoin from "url-join";

export const getOrderAbsoluteUrl = (orderId: string): string =>
  urlJoin(
    window.location.origin,
    getAppMountUriForRedirect(),
    orderPath(encodeURIComponent(orderId)),
  );
