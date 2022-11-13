import classnames from "classnames";
import { Suspense } from "react";
import {
  concat,
  filter,
  map,
  merge,
  Observable,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs";
import { Article, ArticlesResponse } from "../apiTypes";
import { combineStates, useStateObservable } from "../react-bindings";
import { home, Link } from "../router";
import { isLoggedIn$, user$, userFetch$ } from "../user";
import { ArticlesView, Pagination } from "./ArticlesView";

const homeNode = combineStates({
  user$,
  home,
});

const tabSignal = homeNode.createSignal<"global" | "yours">();
export const tagSignal = homeNode.createSignal<string>();
const selectedTab$ = homeNode.substate(
  (ctx, $): Observable<"global" | "yours" | `#${string}`> => {
    const user = ctx(user$);
    return merge(
      $(tabSignal),
      $(tagSignal).pipe(map((v) => `#${v}` as const))
    ).pipe(startWith(user ? ("yours" as const) : ("global" as const)));
  }
);

const pageSignal = selectedTab$.createSignal<number>();
const selectedPage$ = selectedTab$.substate((_, $) =>
  $(pageSignal).pipe(startWith(0))
);

const favoriteSignal = selectedTab$.createSignal<string>();
export const articles$ = selectedTab$.substate(
  (ctx, $): Observable<ArticlesResponse & { isLoading: boolean }> => {
    const selectedTab = ctx(selectedTab$);

    const fetchArticles = (page: number) =>
      selectedTab === "global"
        ? userFetch$<ArticlesResponse>(
            ctx,
            `/articles?limit=10&offset=${page * 10}`
          )
        : selectedTab.startsWith("#")
        ? userFetch$<ArticlesResponse>(
            ctx,
            `/articles?limit=10&offset=${page * 10}&tag=${selectedTab.substring(
              1
            )}`
          )
        : userFetch$<ArticlesResponse>(
            ctx,
            `/articles/feed?limit=10&offset=${page * 10}`
          );

    return $(selectedPage$).pipe(
      withLatestFrom($(articles$).pipe(startWith(null))),
      switchMap(([page, articles]) => {
        const result = fetchArticles(page).pipe(
          map((response) => ({
            ...response,
            isLoading: false,
          }))
        );
        if (!articles) {
          return result;
        }
        return concat([{ ...articles, isLoading: true }], result);
      }),
      switchMap((initialValue) =>
        $(favoriteSignal).pipe(
          // This should become easier once instances land
          map(
            (slug) =>
              initialValue.articles.find((article) => article.slug === slug)!
          ),
          filter((v) => !!v),
          switchMap((article) =>
            userFetch$<{ article: Article }>(
              ctx,
              `/articles/${article.slug}/favorite`,
              {
                method: article.favorited ? "DELETE" : "POST",
              }
            )
          ),
          map(({ article }) => {
            const idx = initialValue.articles.findIndex(
              (a) => a.slug === article.slug
            );
            initialValue.articles = [...initialValue.articles];
            initialValue.articles[idx] = article;
            return {
              ...initialValue,
            };
          }),
          startWith(initialValue)
        )
      )
    );
  }
);

const Feed = () => {
  const currentPage = useStateObservable(selectedPage$);
  const { articles, articlesCount, isLoading } = useStateObservable(articles$);

  return (
    <>
      <ArticlesView
        articles={articles}
        isLoading={isLoading}
        onFavorite={favoriteSignal.push}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={
          articles.length ? Math.ceil(articlesCount / articles.length) : 0
        }
        onPageClick={pageSignal.push}
      />
    </>
  );
};

export const Articles = () => {
  const isLoggedIn = useStateObservable(isLoggedIn$);
  const selectedTab = useStateObservable(selectedTab$);

  return (
    <div className="col-md-9">
      <div className="feed-toggle">
        <ul className="nav nav-pills outline-active">
          {isLoggedIn ? (
            <li className="nav-item">
              <Link
                className={classnames("nav-link", {
                  active: selectedTab === "yours",
                })}
                to=""
                onClick={() => tabSignal.push("yours")}
              >
                Your Feed
              </Link>
            </li>
          ) : null}
          <li className="nav-item">
            <Link
              className={classnames("nav-link", {
                active: selectedTab === "global",
              })}
              to=""
              onClick={() => tabSignal.push("global")}
            >
              Global Feed
            </Link>
          </li>
          {selectedTab.startsWith("#") ? (
            <li className="nav-item">
              <Link className="nav-link active" to="">
                {selectedTab}
              </Link>
            </li>
          ) : null}
        </ul>
      </div>

      <Suspense
        fallback={<div className="article-preview">Loading articles...</div>}
      >
        <Feed />
      </Suspense>
    </div>
  );
};
