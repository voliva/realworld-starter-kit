import {
  concat,
  exhaustMap,
  from,
  map,
  Observable,
  startWith,
  switchMap,
} from "rxjs";
import { User } from "../apiTypes";
import { useStateObservable } from "../react-bindings";
import { API_URL, root } from "../root";
import { Link, navigate } from "../router";
import { userSignal } from "../user";

const loginSignal = root.createSignal<{
  email: string;
  password: string;
}>();
const loginResult$ = root.substate(
  (_, $): Observable<{ loading: boolean; error: string | null }> =>
    $(loginSignal).pipe(
      exhaustMap((user) =>
        concat(
          [
            {
              loading: true,
              error: null,
            },
          ],
          from(
            fetch(`${API_URL}/users/login`, {
              method: "POST",
              body: JSON.stringify({ user }),
              headers: {
                "content-type": "application/json",
              },
            })
          ).pipe(
            switchMap(
              (
                res
              ): Promise<{ user?: User; errors?: Record<string, string[]> }> =>
                res.json()
            ),
            map((res) => {
              if (res.errors) {
                const field = Object.keys(res.errors)[0];
                return {
                  loading: false,
                  error: field + " " + res.errors[field].join(", "),
                };
              }
              if (res.user) {
                userSignal.push(res.user);
                navigate("/");
              }
              return {
                loading: false,
                error: null,
              };
            })
          )
        )
      ),
      startWith({
        loading: false,
        error: null,
      })
    )
);

export const Login = () => {
  const { error, loading } = useStateObservable(loginResult$);

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign in</h1>
            <p className="text-xs-center">
              <Link to="/register">Need an account?</Link>
            </p>

            {error ? (
              <ul className="error-messages">
                <li>{error}</li>
              </ul>
            ) : null}

            <form
              method="post"
              onSubmit={(evt) => {
                evt.preventDefault();
                const data = new FormData(evt.currentTarget);
                const email = data.get("email") as string;
                const password = data.get("password") as string;
                loginSignal.push({ email, password });
              }}
            >
              <fieldset className="form-group">
                <input
                  name="email"
                  className="form-control form-control-lg"
                  type="text"
                  placeholder="Email"
                  disabled={loading}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  name="password"
                  className="form-control form-control-lg"
                  type="password"
                  placeholder="Password"
                  disabled={loading}
                />
              </fieldset>
              <button
                className="btn btn-lg btn-primary pull-xs-right"
                disabled={loading}
              >
                Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
