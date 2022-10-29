export interface User {
  email: string;
  username: string;
  bio: null;
  image: string;
  token: string;
}
export interface Author {
  bio: null;
  following: boolean;
  image: string;
  username: string;
}
export interface Article {
  author: Author;
  body: string;
  createdAt: string;
  description: string;
  favorited: boolean;
  favoritesCount: number;
  slug: string;
  tagList: string[];
  title: string;
  updatedAt: string;
}
export interface ArticlesResponse {
  articles: Array<Article>;
  articlesCount: number;
}
