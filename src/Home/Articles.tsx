import { FC, Suspense, useState } from "react";
import { from, switchMap } from "rxjs";
import { ArticlesResponse } from "../apiTypes";
import { useStateObservable } from "../react-bindings";
import { API_URL, root } from "../root";
import { isLoggedIn$ } from "../user";

export const globalArticles$ = root.substate(() =>
  from(fetch(`${API_URL}/articles`)).pipe(
    switchMap((res) => res.json() as Promise<ArticlesResponse>)
  )
);

const GlobalFeed = () => {
  const { articles, articlesCount } = useStateObservable(globalArticles$);

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

      <Pagination
        currentPage={0}
        totalPages={Math.ceil(articlesCount / articles.length)}
      />
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
          .map((_, i) => i + 1)
          .map((page) => (
            <li
              key={page}
              className={`page-item ${
                page === currentPage + 1 ? "active" : ""
              }`}
            >
              <a className="page-link" href="">
                {page}
              </a>
            </li>
          ))}
      </ul>
    </nav>
  );
};

export const Articles = () => {
  const isLoggedIn = useStateObservable(isLoggedIn$);

  return (
    <div className="col-md-9">
      <div className="feed-toggle">
        <ul className="nav nav-pills outline-active">
          {isLoggedIn ? (
            <li className="nav-item">
              <a className="nav-link" href="">
                Your Feed
              </a>
            </li>
          ) : null}
          <li className="nav-item">
            <a className="nav-link active" href="">
              Global Feed
            </a>
          </li>
        </ul>
      </div>

      <Suspense
        fallback={<div className="article-preview">Loading articles...</div>}
      >
        <GlobalFeed />
      </Suspense>
    </div>
  );
};
