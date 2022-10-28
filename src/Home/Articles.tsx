import { from, switchMap } from "rxjs";
import { useStateObservable } from "../react-bindings";
import { API_URL, root } from "../root";

export const globalArticles$ = root.substate(() =>
  from(fetch(`${API_URL}/articles`)).pipe(
    switchMap(
      (res) =>
        res.json() as Promise<{
          articles: Array<{
            author: {
              bio: null;
              following: boolean;
              image: string;
              username: string;
            };
            body: string;
            createdAt: string;
            description: string;
            favorited: boolean;
            favoritesCount: number;
            slug: string;
            tagList: string[];
            title: string;
            updatedAt: string;
          }>;
          articlesCount: number;
        }>
    )
  )
);

export const Articles = () => {
  const { articles, articlesCount } = useStateObservable(globalArticles$);

  const renderPagination = () => {
    if (articlesCount <= 1) return null;

    return (
      <nav>
        <ul className="pagination">
          {new Array(Math.ceil(articlesCount / articles.length))
            .fill(0)
            .map((_, i) => i + 1)
            .map((page) => (
              <li
                key={page}
                className={`page-item ng-scope ${page === 1 ? "active" : ""}`}
              >
                <a className="page-link ng-binding" href="">
                  {page}
                </a>
              </li>
            ))}
        </ul>
      </nav>
    );
  };

  return (
    <div className="col-md-9">
      <div className="feed-toggle">
        <ul className="nav nav-pills outline-active">
          <li className="nav-item">
            <a className="nav-link disabled" href="">
              Your Feed
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link active" href="">
              Global Feed
            </a>
          </li>
        </ul>
      </div>

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

      {renderPagination()}
    </div>
  );
};
