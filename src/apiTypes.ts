export interface User {
  email: string;
  username: string;
  bio: null;
  image: string;
  token: string;
}
export interface Profile {
  bio: null;
  following: boolean;
  image: string;
  username: string;
}
export interface Article {
  author: Profile;
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

export interface Comment {
  id: number;
  createdAt: string;
  updatedAt: string;
  body: string;
  author: Profile;
}
