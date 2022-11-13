import classnames from "classnames";
import { FC } from "react";
import { Article } from "../apiTypes";
import { ArticleInfo } from "../Article/ArticleInfo";
import { useStateObservable } from "../react-bindings";
import { navigate, Link } from "../router";
import { isLoggedIn$ } from "../user";

export const ArticlesView: FC<{
  articles: Article[];
  isLoading: boolean;
  onFavorite: (slug: string) => void;
}> = ({ articles, isLoading, onFavorite }) => {
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
            <ArticleInfo article={article} />
            <button
              className={classnames("btn btn-sm pull-xs-right", {
                "btn-outline-primary": !article.favorited,
                "btn-primary": article.favorited,
              })}
              onClick={() =>
                isLoggedIn ? onFavorite(article.slug) : navigate("/register")
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

export const Pagination: FC<{
  currentPage: number;
  totalPages: number;
  onPageClick: (page: number) => void;
}> = ({ currentPage, totalPages, onPageClick }) => {
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
                onClick={() => onPageClick(page)}
              >
                {page + 1}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
};
