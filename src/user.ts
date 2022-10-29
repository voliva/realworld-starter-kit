import { defer, map, merge, Observable, of, switchMap, tap } from "rxjs";
import { User } from "./apiTypes";
import { API_URL, root } from "./root";

export const userSignal = root.createSignal<User>();

export const user$ = root.substate((): Observable<User | null> => {
  const login$ = userSignal
    .getSignal$()
    .pipe(tap((user) => localStorage.setItem("jwtToken", user.token)));

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
