import { RouterState } from "@remix-run/router";
import { matchRoutes } from "react-router-dom";
import { Observable } from "rxjs";
import { root } from "./root";
import { router } from "./router";

export const matchedRoutes$ = root.substate(
  () =>
    new Observable<ReturnType<typeof matchRoutes>>((obs) => {
      function update(state: RouterState) {
        const r = matchRoutes(router.routes, state.location);

        obs.next(r);
      }
      update(router.state);
      return router.subscribe(update);
    })
);
