import {
  catchError,
  concat,
  EMPTY,
  filter,
  map,
  NEVER,
  of,
  race,
  take,
} from "rxjs";
import { Article as APIArticle } from "../apiTypes";
import { combineStates, useStateObservable } from "../react-bindings";
import { user$, userFetch$ } from "../user";
import { articles$ } from "../Home/Articles";
import { format } from "date-fns";
import React, { FC } from "react";
import { article } from "../router";

const selectedArticle$ = combineStates({
  article,
  user: user$,
}).substate((ctx, $) => {
  const slug = ctx(article);

  const freshRequest$ = userFetch$<{ article: APIArticle }>(
    ctx,
    `/articles/${slug}`
  ).pipe(map(({ article }) => article));
  const existingArticle$ = $(articles$).pipe(
    take(1),
    map(({ articles }) => articles.find((article) => article.slug === slug)!),
    filter((v) => !!v),
    catchError(() => EMPTY)
  );

  return race(concat(existingArticle$, NEVER), freshRequest$);
});

export const Article = () => {
  const article = useStateObservable(selectedArticle$);

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>

          <ArticleMeta article={article} />
        </div>
      </div>

      <div className="container page">
        <div className="row article-content">
          <div className="col-xs-12">
            <p>
              {article.body.split("\\n").map((v, i) => (
                <React.Fragment key={i}>
                  {v}
                  <br />
                </React.Fragment>
              ))}
            </p>
            <ul className="tag-list">
              {article.tagList.map((tag) => (
                <li
                  key={tag}
                  className="tag-default tag-pill tag-outline"
                >{` ${tag} `}</li>
              ))}
            </ul>
          </div>
        </div>

        <hr />

        <ArticleMeta article={article} />

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            <form className="card comment-form">
              <div className="card-block">
                <textarea
                  className="form-control"
                  placeholder="Write a comment..."
                  rows={3}
                ></textarea>
              </div>
              <div className="card-footer">
                <img
                  src="http://i.imgur.com/Qr71crq.jpg"
                  className="comment-author-img"
                />
                <button className="btn btn-sm btn-primary">Post Comment</button>
              </div>
            </form>

            <div className="card">
              <div className="card-block">
                <p className="card-text">
                  With supporting text below as a natural lead-in to additional
                  content.
                </p>
              </div>
              <div className="card-footer">
                <a href="" className="comment-author">
                  <img
                    src="http://i.imgur.com/Qr71crq.jpg"
                    className="comment-author-img"
                  />
                </a>
                &nbsp;
                <a href="" className="comment-author">
                  Jacob Schmidt
                </a>
                <span className="date-posted">Dec 29th</span>
              </div>
            </div>

            <div className="card">
              <div className="card-block">
                <p className="card-text">
                  With supporting text below as a natural lead-in to additional
                  content.
                </p>
              </div>
              <div className="card-footer">
                <a href="" className="comment-author">
                  <img
                    src="http://i.imgur.com/Qr71crq.jpg"
                    className="comment-author-img"
                  />
                </a>
                &nbsp;
                <a href="" className="comment-author">
                  Jacob Schmidt
                </a>
                <span className="date-posted">Dec 29th</span>
                <span className="mod-options">
                  <i className="ion-edit"></i>
                  <i className="ion-trash-a"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArticleMeta: FC<{ article: APIArticle }> = ({ article }) => (
  <div className="article-meta">
    <a href="">
      <img src={article.author.image} />
    </a>
    <div className="info">
      {/* TODO is this shared with Articles?*/}
      <a href="" className="author">
        {article.author.username}
      </a>
      <span className="date">
        {format(new Date(article.createdAt), "MMMM d, yyyy")}
      </span>
    </div>
    <button className="btn btn-sm btn-outline-secondary">
      <i className="ion-plus-round"></i>
      &nbsp; Follow {article.author.username}{" "}
    </button>
    <button className="btn btn-sm btn-outline-primary">
      <i className="ion-heart"></i>
      &nbsp; Favorite Article{" "}
      <span className="counter">({article.favoritesCount})</span>
    </button>
  </div>
);
