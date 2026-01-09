import { mount, lazy, redirect } from "navi";

import { legacyRoutes } from "@/AppRouter";
import getRoute from "@/utils/getRoute";

export default {
  groups: lazy(() => import("./groups/GroupsPage")),
  user: mount({
    "/:userId": mount({
      ...legacyRoutes({
        edit: redirect(request => `/user/${request.params.userId}/edit/profile`)
      }),
      "/edit/:type": redirect(request => `/u/${request.params.userId}/edit/${request.params.type}`),
      "/": redirect(request => `/u/${request.params.userId}`),
    })
  }),
  u: mount({
    "/:username": getRoute(() => import("./user/UserPage"), "byUsername"),
    "/:username/edit/:type": lazy(() => import("./edit/UserEditPage")),
    "/": lazy(() => import("./users/UsersPage"))
  })
};
