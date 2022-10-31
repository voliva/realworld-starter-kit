import { createHashHistory, Update } from "history";
import React, { FC, PropsWithChildren } from "react";
import { Observable } from "rxjs";
import { root } from "./root";

export const history = createHashHistory();

export const history$ = root.substate(
  () =>
    new Observable<Update>((obs) => {
      obs.next({
        action: history.action,
        location: history.location,
      });
      return history.listen((r) => obs.next(r));
    })
);

export const [activeRoute, { article, home }] = history$.routeState(
  {
    article: ({ location }) => location.pathname.substring("/article/".length),
    home: null,
    none: null,
  },
  ({ location }) => {
    if (location.pathname === "/") {
      return "home";
    }
    if (location.pathname.startsWith("/article")) {
      return "article";
    }
    return "none";
  }
);

export const Link: FC<
  PropsWithChildren<{
    to: string;
    className?: string;
    onClick?: (evt: React.MouseEvent) => void;
  }>
> = ({ to, children, onClick, ...rest }) => (
  <a
    href={to}
    onClick={(evt) => {
      evt.preventDefault();
      history.push(to);
      onClick?.(evt);
    }}
    {...rest}
  >
    {children}
  </a>
);

export const navigate = (to: string) => history.push(to);
