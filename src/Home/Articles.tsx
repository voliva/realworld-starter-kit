import classnames from "classnames";
import { format } from "date-fns";
import { FC, Suspense } from "react";
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
import { useStateObservable } from "../react-bindings";
import { Link, navigate } from "../router";
import { isLoggedIn$, user$, userFetch$ } from "../user";

const tabSignal = user$.createSignal<"global" | "yours">();
export const tagSignal = user$.createSignal<string>();
const selectedTab$ = user$.substate(
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
      <ArticlesView articles={articles} isLoading={isLoading} />
      <Pagination
        currentPage={currentPage}
        totalPages={
          articles.length ? Math.ceil(articlesCount / articles.length) : 0
        }
      />
    </>
  );
};

const ArticlesView: FC<{ articles: Article[]; isLoading: boolean }> = ({
  articles,
  isLoading,
}) => {
  const isLoggedIn = useStateObservable(isLoggedIn$);

  if (articles.length === 0) {
    return <div className="article-preview">No articles are here... yet.</div>;
  }
  return (
    <>
      {articles.map((article) => (
        <div className="article-preview" key={article.slug}>
          <div className="article-meta">
            <a href="profile.html">
              <img src={article.author.image} />
            </a>
            <div className="info">
              <a href="" className="author">
                {article.author.username}
              </a>
              <span className="date">
                {format(new Date(article.createdAt), "MMMM d, yyyy")}
              </span>
            </div>
            <button
              className={classnames("btn btn-sm pull-xs-right", {
                "btn-outline-primary": !article.favorited,
                "btn-primary": article.favorited,
              })}
              onClick={() =>
                isLoggedIn
                  ? favoriteSignal.push(article.slug)
                  : navigate("/register")
              }
            >
              <i className="ion-heart"></i> {article.favoritesCount}
            </button>
          </div>
          <Link to={`/article/${article.slug}`} className="preview-link">
            <h1>{article.title}</h1>
            <p>{article.description}</p>
            <span>Read more...</span>
            <ul className="tag-list">
              {article.tagList.map((tag, i) => (
                <li key={i} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
          </Link>
        </div>
      ))}
      {isLoading ? (
        <div className="article-preview">Loading articles...</div>
      ) : null}
    </>
  );
};

const Pagination: FC<{
  currentPage: number;
  totalPages: number;
}> = ({ currentPage, totalPages }) => {
  if (totalPages <= 1) return null;

  return (
    <nav>
      <ul className="pagination">
        {new Array(totalPages)
          .fill(0)
          .map((_, i) => i)
          .map((page) => (
            <li
              key={page}
              className={`page-item ${page === currentPage ? "active" : ""}`}
            >
              <Link
                className="page-link"
                to=""
                onClick={() => pageSignal.push(page)}
              >
                {page + 1}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
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
