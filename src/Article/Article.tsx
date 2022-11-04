import {
  catchError,
  concat,
  EMPTY,
  filter,
  map,
  mergeMap,
  NEVER,
  of,
  race,
  startWith,
  take,
} from "rxjs";
import { Article as APIArticle, Comment as APIComment } from "../apiTypes";
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
          <Comments />
        </div>
      </div>
    </div>
  );
};

const comments$ = selectedArticle$.substate((ctx) => {
  const article = ctx(selectedArticle$);

  return userFetch$<{ comments: APIComment[] }>(
    ctx,
    `/articles/${article.slug}/comments`
  ).pipe(
    map((v) => v.comments),
    startWith([])
  );
});

const Comments = () => {
  const comments = useStateObservable(comments$);

  return (
    <div className="col-xs-12 col-md-8 offset-md-2">
      <PostComment />

      {comments.map((c) => (
        <Comment key={c.id} comment={c} />
      ))}
    </div>
  );
};

const PostComment = () => {
  const user = useStateObservable(user$);

  if (!user) return null;

  return (
    <form className="card comment-form">
      <div className="card-block">
        <textarea
          className="form-control"
          placeholder="Write a comment..."
          rows={3}
        ></textarea>
      </div>
      <div className="card-footer">
        <img src={user.image} className="comment-author-img" />
        <button className="btn btn-sm btn-primary">Post Comment</button>
      </div>
    </form>
  );
};

const deleteComment$ = comments$.createSignal<number>();
// TODO with insntances it should be easier to delete one speicifc instance
comments$.substate((ctx, $) => {
  const article = ctx(selectedArticle$);

  return $(deleteComment$).pipe(
    mergeMap((id) =>
      userFetch$(ctx, `/articles/${article.slug}/comments/${id}`, {
        method: "DELETE",
      })
    )
  );
});

const Comment: FC<{ comment: APIComment }> = ({ comment }) => {
  const user = useStateObservable(user$);

  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{comment.body}</p>
      </div>
      <div className="card-footer">
        <a href="" className="comment-author">
          <img src={comment.author.image} className="comment-author-img" />
        </a>
        &nbsp;
        <a href="" className="comment-author">
          {comment.author.username}
        </a>
        <span className="date-posted">
          {format(new Date(comment.createdAt), "MMMM d, yyyy")}
        </span>
        <span className="mod-options">
          {user?.username === comment.author.username ? (
            <i
              className="ion-trash-a"
              onClick={() => deleteComment$.push(comment.id)}
            ></i>
          ) : null}
        </span>
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
