import { format } from "date-fns";
import { FC } from "react";
import { Article } from "../apiTypes";
import { Link } from "../router";

export const ArticleInfo: FC<{ article: Article }> = ({ article }) => (
  <div className="info">
    <Link to={`/@${article.author.username}`} className="author">
      {article.author.username}
    </Link>
    <span className="date">
      {format(new Date(article.createdAt), "MMMM d, yyyy")}
    </span>
  </div>
);
