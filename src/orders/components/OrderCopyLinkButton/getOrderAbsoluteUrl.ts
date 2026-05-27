import { getAppMountUriForRedirect } from "@dashboard/utils/urls";
import urlJoin from "url-join";

import { orderPath } from "../../urls";

export const getOrderAbsoluteUrl = (orderId: string): string =>
  urlJoin(
    window.location.origin,
    getAppMountUriForRedirect(),
    orderPath(encodeURIComponent(orderId)),
  );
