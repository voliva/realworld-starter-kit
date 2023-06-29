import {
  concat,
  filter,
  map,
  Observable,
  startWith,
  switchMap,
  withLatestFrom,
} from "rxjs";
import { ArticlesResponse, Article } from "../apiTypes";
import { ArticlesView, Pagination } from "../Home/ArticlesView";
import { combineStateNodes, useStateObservable } from "../react-bindings";
import { profile } from "../router";
import { user$, userFetch$ } from "../user";

export const tabSignal = profile.createSignal<"myArticles" | "favorited">();
export const selectedTab$ = profile.substate(
  (_, $): Observable<"myArticles" | "favorited"> => {
    return $(tabSignal).pipe(startWith("myArticles" as const));
  }
);

const pageSignal = selectedTab$.createSignal<number>();
const selectedPage$ = selectedTab$.substate((_, $) =>
  $(pageSignal).pipe(startWith(0))
);

const favoriteSignal = selectedTab$.createSignal<string>();
const articles$ = combineStateNodes({ selectedTab$, user$ }).substate(
  (ctx, $): Observable<ArticlesResponse & { isLoading: boolean }> => {
    const selectedTab = ctx(selectedTab$);
    const author = ctx(profile);

    const fetchArticles = (page: number) =>
      selectedTab === "myArticles"
        ? userFetch$<ArticlesResponse>(
            ctx,
            `/articles?author=${author}&limit=10&offset=${page * 10}`
          )
        : userFetch$<ArticlesResponse>(
            ctx,
            `/articles?favorited=${author}&limit=10&offset=${page * 10}`
          );

    return $(selectedPage$).pipe(
      withLatestFrom($(articles$).pipe(startWith(null))),
      switchMap(([page, articles]) => {
        const result = fetchArticles(page).pipe(
          map((response) => ({
            ...response,
            isLoading: false,
          }))
        );
        if (!articles) {
          return result;
        }
        return concat([{ ...articles, isLoading: true }], result);
      }),
      switchMap((initialValue) =>
        $(favoriteSignal).pipe(
          // This should become easier once instances land
          map(
            (slug) =>
              initialValue.articles.find((article) => article.slug === slug)!
          ),
          filter((v) => !!v),
          switchMap((article) =>
            userFetch$<{ article: Article }>(
              ctx,
              `/articles/${article.slug}/favorite`,
              {
                method: article.favorited ? "DELETE" : "POST",
              }
            )
          ),
          map(({ article }) => {
            const idx = initialValue.articles.findIndex(
              (a) => a.slug === article.slug
            );
            initialValue.articles = [...initialValue.articles];
            initialValue.articles[idx] = article;
            return {
              ...initialValue,
            };
          }),
          startWith(initialValue)
        )
      )
    );
  }
);

export const Feed = () => {
  const currentPage = useStateObservable(selectedPage$);
  const { articles, articlesCount, isLoading } = useStateObservable(articles$);

  return (
    <>
      <ArticlesView
        articles={articles}
        isLoading={isLoading}
        onFavorite={favoriteSignal.push}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={
          articles.length ? Math.ceil(articlesCount / articles.length) : 0
        }
        onPageClick={pageSignal.push}
      />
    </>
  );
};
