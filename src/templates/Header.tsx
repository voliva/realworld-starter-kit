import { useStateObservable } from "../react-bindings";
import { user$ } from "../user";
import { Link } from "react-router-dom";

export const Header = () => {
  const user = useStateObservable(user$);

  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          conduit
        </Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            {/* Add "active" className when you're on that page" */}
            <Link className="nav-link active" to="/">
              Home
            </Link>
          </li>
          {user ? (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/new-article">
                  <i className="ion-compose"></i>&nbsp;New Article
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/settings">
                  <i className="ion-gear-a"></i>&nbsp;Settings
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/user">
                  <img src={user.image} className="user-pic" />
                  &nbsp;{user.username}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Sign in
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">
                  Sign up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};
