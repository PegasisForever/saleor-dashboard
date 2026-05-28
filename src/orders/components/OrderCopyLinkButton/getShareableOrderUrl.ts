import { orderUrl } from "@dashboard/orders/urls";
import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import urlJoin from "url-join";

export const getShareableOrderUrl = (orderId: string): string => {
  const relativePath = orderUrl(orderId);

  return urlJoin(window.location.origin, getAppMountUriForRedirect(), relativePath);
};
