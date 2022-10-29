import { defer, map, merge, Observable, of, switchMap, tap } from "rxjs";
import { User } from "./apiTypes";
import { API_URL, root } from "./root";

export const loginSignal = root.createSignal<{
  email: string;
  password: string;
}>();

export const user$ = root.substate((): Observable<User | null> => {
  const login$ = loginSignal.getSignal$().pipe(
    switchMap((user) =>
      fetch(`${API_URL}/login`, {
        method: "POST",
        body: JSON.stringify({ user }),
      })
    ),
    switchMap((res) => res.json() as Promise<{ user: User }>),
    map(({ user }) => user),
    tap(({ token }) => localStorage.setItem("jwtToken", token))
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
