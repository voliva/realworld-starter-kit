import { format } from "date-fns";
import { FC } from "react";
import { Article } from "../apiTypes";

export const ArticleInfo: FC<{ article: Article }> = ({ article }) => (
  <div className="info">
    <a href="" className="author">
      {article.author.username}
    </a>
    <span className="date">
      {format(new Date(article.createdAt), "MMMM d, yyyy")}
    </span>
  </div>
);
