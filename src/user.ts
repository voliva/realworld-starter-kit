import { defer, map, merge, Observable, of, switchMap, tap } from "rxjs";
import { User } from "./apiTypes";
import { CtxValue } from "./react-bindings";
import { API_URL, root } from "./root";

export const userSignal = root.createSignal<User>();

export const user$ = root.substate((_, $): Observable<User | null> => {
  const login$ = $(userSignal).pipe(
    tap((user) => localStorage.setItem("jwtToken", user.token))
  );

  const jwtToken = localStorage.getItem("jwtToken");
  if (jwtToken) {
    return merge(
      defer(() =>
        fetch(`${API_URL}/user`, {
          headers: {
            authorization: `Token ${jwtToken}`,
          },
        })
      ).pipe(
        switchMap((res) => res.json() as Promise<{ user: User }>),
        map(({ user }) => user)
      ),
      login$
    );
  }
  return merge(of(null), login$);
});

export const isLoggedIn$ = user$.substate((ctx) => of(ctx(user$) !== null));

export const userFetch$ = <T>(
  ctx: CtxValue,
  path: string,
  init?: RequestInit
) =>
  defer(() => {
    const token = ctx(user$)?.token;

    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token
          ? {
              authorization: `Token ${token}`,
            }
          : {}),
      },
    });
  }).pipe(switchMap((r) => r.json() as Promise<T>));
