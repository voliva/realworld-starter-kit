import classnames from "classnames";
import { FC, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import {
  concat,
  from,
  map,
  merge,
  Observable,
  of,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs";
import { Article, ArticlesResponse } from "../apiTypes";
import { useStateObservable } from "../react-bindings";
import { API_URL, root } from "../root";
import { isLoggedIn$, user$ } from "../user";

const tabSignal = user$.createSignal<"global" | "yours">();
export const tagSignal = user$.createSignal<string>();
const selectedTab$ = user$.substate(
  (ctx): Observable<"global" | "yours" | `#${string}`> => {
    const user = ctx(user$);
    return merge(
      tabSignal.getSignal$(),
      tagSignal.getSignal$().pipe(map((v) => `#${v}` as const))
    ).pipe(startWith(user ? ("yours" as const) : ("global" as const)));
  }
);

const pageSignal = selectedTab$.createSignal<number>();
const selectedPage$ = selectedTab$.substate(() =>
  pageSignal.getSignal$().pipe(startWith(0))
);

const articles$ = selectedTab$.substate(
  (ctx, $): Observable<ArticlesResponse & { isLoading: boolean }> => {
    const selectedTab = ctx(selectedTab$);
    const user = ctx(user$);

    const fetchArticles = (page: number) =>
      selectedTab === "global"
        ? fetch(`${API_URL}/articles?limit=10&offset=${page * 10}`)
        : selectedTab.startsWith("#")
        ? fetch(
            `${API_URL}/articles?limit=10&offset=${
              page * 10
            }&tag=${selectedTab.substring(1)}`
          )
        : fetch(`${API_URL}/articles/feed?limit=10&offset=${page * 10}`, {
            headers: {
              authorization: `Token ${user!.token}`,
            },
          });

    return $(selectedPage$).pipe(
      withLatestFrom($(articles$).pipe(startWith(null))),
      switchMap(([page, articles]) => {
        const result = fetchArticles(page)
          .then((r): Promise<ArticlesResponse> => r.json())
          .then((response) => ({
            ...response,
            isLoading: false,
          }));
        if (!articles) {
          return result;
        }
        return concat([{ ...articles, isLoading: true }], result);
      })
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
              <span className="date">{article.createdAt}</span>
            </div>
            <button className="btn btn-outline-primary btn-sm pull-xs-right">
              <i className="ion-heart"></i> {article.favoritesCount}
            </button>
          </div>
          <a href="" className="preview-link">
            <h1>{article.title}</h1>
            <p>{article.body.split("\\n")[0]}</p>
            <span>Read more...</span>
            <ul className="tag-list">
              {article.tagList.map((tag, i) => (
                <li key={i} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
          </a>
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
