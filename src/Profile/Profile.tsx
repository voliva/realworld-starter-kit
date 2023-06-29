import classNames from "classnames";
import { Suspense } from "react";
import { map, startWith, switchMap } from "rxjs";
import { Profile as APIProfile } from "../apiTypes";
import { combineStateNodes, useStateObservable } from "../react-bindings";
import { Link, profile } from "../router";
import { user$, userFetch$ } from "../user";
import { Feed, selectedTab$, tabSignal } from "./Feed";

const followSignal = profile.createSignal();
const selectedProfile$ = combineStateNodes({
  profile,
  user$,
}).substate((ctx, $) => {
  const profileName = ctx(profile);

  return userFetch$<{ profile: APIProfile }>(
    ctx,
    `/profiles/${profileName}`
  ).pipe(
    map(({ profile }) => profile),
    switchMap((initialValue) =>
      $(followSignal).pipe(
        switchMap(() =>
          userFetch$<{ profile: APIProfile }>(
            ctx,
            `/profiles/${initialValue.username}/follow`,
            {
              method: initialValue.following ? "DELETE" : "POST",
            }
          )
        ),
        map(({ profile }) => {
          initialValue.following = profile.following;
          return profile;
        }),
        startWith(initialValue)
      )
    )
  );
});

export const Profile = () => {
  const profile = useStateObservable(selectedProfile$);
  const selectedTab = useStateObservable(selectedTab$);

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <img src={profile.image} className="user-img" />
              <h4>{profile.username}</h4>
              <p>{profile.bio}</p>
              <button
                className={classNames("btn btn-sm action-btn", {
                  "btn-outline-secondary": !profile.following,
                  "btn-secondary": profile.following,
                })}
                onClick={() => followSignal.push(null)}
              >
                <i className="ion-plus-round"></i>
                &nbsp; {profile.following ? "Unfollow" : "Follow"}{" "}
                {profile.username}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <Link
                    className={classNames("nav-link", {
                      active: selectedTab === "myArticles",
                    })}
                    to=""
                    onClick={() => tabSignal.push("myArticles")}
                  >
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={classNames("nav-link", {
                      active: selectedTab === "favorited",
                    })}
                    to=""
                    onClick={() => tabSignal.push("favorited")}
                  >
                    Favorited Articles
                  </Link>
                </li>
              </ul>
            </div>

            <Suspense
              fallback={
                <div className="article-preview">Loading articles...</div>
              }
            >
              <Feed />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};
