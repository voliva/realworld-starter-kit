import { defer, map, merge, Observable, of, switchMap, tap } from "rxjs";
import { User } from "./apiTypes";
import { GetValueFn } from "@react-rxjs/context-state";
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
  ctx: GetValueFn,
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: any }
) =>
  defer(() => {
    const token = ctx(user$)?.token;

    return fetch(`${API_URL}${path}`, {
      ...init,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      headers: {
        ...(typeof init?.body === "object"
          ? {
              "content-type": "application/json",
            }
          : {}),
        ...init?.headers,
        ...(token
          ? {
              authorization: `Token ${token}`,
            }
          : {}),
      },
    });
  }).pipe(
    switchMap((r) =>
      r.status === 204 ? of(undefined as T) : (r.json() as Promise<T>)
    )
  );
