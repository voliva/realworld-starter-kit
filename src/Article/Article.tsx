import {
  catchError,
  concat,
  EMPTY,
  exhaustMap,
  filter,
  map,
  merge,
  mergeMap,
  NEVER,
  of,
  race,
  startWith,
  switchMap,
  take,
  tap,
} from "rxjs";
import {
  Article as APIArticle,
  Comment as APIComment,
  Profile,
} from "../apiTypes";
import { combineStates, useStateObservable } from "../react-bindings";
import { user$, userFetch$ } from "../user";
import { articles$ } from "../Home/Articles";
import { format } from "date-fns";
import React, { FC } from "react";
import { article, history, Link } from "../router";
import { ArticleInfo } from "./ArticleInfo";
import classNames from "classnames";

const favoriteSignal = article.createSignal();
const followSignal = article.createSignal();
const selectedArticle$ = combineStates({
  article,
  user$,
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

  return race(concat(existingArticle$, NEVER), freshRequest$).pipe(
    switchMap((initialValue) =>
      merge(
        $(favoriteSignal).pipe(
          switchMap(() =>
            userFetch$<{ article: APIArticle }>(
              ctx,
              `/articles/${initialValue.slug}/favorite`,
              {
                method: initialValue.favorited ? "DELETE" : "POST",
              }
            )
          ),
          map(({ article }) => {
            initialValue.favorited = article.favorited;
            return article;
          })
        ),
        $(followSignal).pipe(
          switchMap(() =>
            userFetch$<{ profile: Profile }>(
              ctx,
              `/profiles/${initialValue.author.username}/follow`,
              {
                method: initialValue.author.following ? "DELETE" : "POST",
              }
            )
          ),
          map(({ profile }) => {
            initialValue.author = profile;
            return { ...initialValue };
          })
        )
      ).pipe(startWith(initialValue))
    )
  );
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

        <div className="article-actions">
          <ArticleMeta article={article} />
        </div>

        <div className="row">
          <Comments />
        </div>
      </div>
    </div>
  );
};

const deleteComment$ = selectedArticle$.createSignal<number>();
const createComment$ = selectedArticle$.createSignal<string>();

// TODO subsignal?
/**
 * For delete maybe it doesn't make that much sense, but for create it does.
 * On create I want to 1. Add a new instance, 2. clear the form.
 * If I have a "subsignal" (or a derived signal), then I can have just one observable
 * that emits when a post is created, then each observable reacts to that.
 */
const deletedComment$ = selectedArticle$.substate((ctx, $) => {
  const article = ctx(selectedArticle$);

  return $(deleteComment$).pipe(
    mergeMap((id) =>
      userFetch$(ctx, `/articles/${article.slug}/comments/${id}`, {
        method: "DELETE",
      }).pipe(map(() => id))
    )
  );
});
const createdComment$ = selectedArticle$.substate((ctx, $) => {
  const article = ctx(selectedArticle$);

  return $(createComment$).pipe(
    exhaustMap((body) =>
      userFetch$<{ comment: APIComment }>(
        ctx,
        `/articles/${article.slug}/comments`,
        {
          method: "POST",
          body: { comment: { body } },
        }
      )
    ),
    map((v) => v.comment)
  );
});

const comments$ = selectedArticle$
  .substate(
    // TODO I don't want the selectedArticle$ from killing this observable, but I can't put this up to selectedArticle$ either because then it doesn't emit updates
    // (which is ok for this observable, but not good for the UI because the update could be relevant)
    (ctx) => of(ctx(selectedArticle$)),
    (a, b) => a.slug === b.slug
  )
  .substate((ctx, $) => {
    const article = ctx(selectedArticle$);

    return userFetch$<{ comments: APIComment[] }>(
      ctx,
      `/articles/${article.slug}/comments`
    ).pipe(
      map((v) => v.comments),
      switchMap((initialValue) =>
        merge(
          $(deletedComment$).pipe(
            map((id) => {
              return (initialValue = initialValue.filter(
                (coment) => coment.id !== id
              ));
            })
          ),
          $(createdComment$).pipe(
            map((comment) => {
              return (initialValue = [comment, ...initialValue]);
            })
          )
        ).pipe(startWith(initialValue))
      ),
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

const bodySignal$ = selectedArticle$.createSignal<string>();
const newCommentBody$ = selectedArticle$.substate((_, $) =>
  merge($(bodySignal$), $(createdComment$).pipe(map(() => ""))).pipe(
    startWith("")
  )
);
const PostComment = () => {
  const user = useStateObservable(user$);
  const body = useStateObservable(newCommentBody$);

  if (!user) return null;

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    if (body.length) {
      createComment$.push(body);
    }
  };

  return (
    <form className="card comment-form" onSubmit={handleSubmit}>
      <div className="card-block">
        <textarea
          className="form-control"
          placeholder="Write a comment..."
          rows={3}
          value={body}
          onChange={(e) => bodySignal$.push(e.target.value)}
        ></textarea>
      </div>
      <div className="card-footer">
        <img src={user.image} className="comment-author-img" />
        <button className="btn btn-sm btn-primary">Post Comment</button>
      </div>
    </form>
  );
};

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
        <Link to={`/@${comment.author.username}`} className="comment-author">
          {comment.author.username}
        </Link>
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

const deleteSignal$ = selectedArticle$.createSignal();
selectedArticle$.substate((ctx, $) => {
  const article = ctx(selectedArticle$);

  return $(deleteSignal$).pipe(
    exhaustMap(() =>
      userFetch$(ctx, "/articles/" + article.slug, {
        method: "DELETE",
      })
    ),
    tap(() => history.push("/"))
  );
});

const ArticleMeta: FC<{ article: APIArticle }> = ({ article }) => {
  const user = useStateObservable(user$);

  function renderOwnActions() {
    return (
      <>
        <Link
          className="btn btn-sm btn-outline-secondary"
          to={`/editor/${article.slug}`}
        >
          <i className="ion-edit"></i>
          &nbsp; Edit Article{" "}
        </Link>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => deleteSignal$.push(null)}
        >
          <i className="ion-trash-a"></i>
          &nbsp; Delete Article{" "}
        </button>
      </>
    );
  }
  function renderOthersActions() {
    return (
      <>
        <button
          className={classNames("btn btn-sm", {
            "btn-outline-secondary": !article.author.following,
            "btn-secondary": article.author.following,
          })}
          onClick={() => followSignal.push(null)}
        >
          <i className="ion-plus-round"></i>
          &nbsp; {article.author.following ? "Unfollow" : "Follow"}{" "}
          {article.author.username}{" "}
        </button>
        <button
          className={classNames("btn btn-sm", {
            "btn-outline-primary": !article.favorited,
            "btn-primary": article.favorited,
          })}
          onClick={() => favoriteSignal.push(null)}
        >
          <i className="ion-heart"></i>
          &nbsp; {article.favorited ? "Unfavorite" : "Favorite"} Article{" "}
          <span className="counter">({article.favoritesCount})</span>
        </button>
      </>
    );
  }

  return (
    <div className="article-meta">
      <a href="">
        <img src={article.author.image} />
      </a>
      <ArticleInfo article={article} />
      {user?.username === article.author.username
        ? renderOwnActions()
        : renderOthersActions()}
    </div>
  );
};
