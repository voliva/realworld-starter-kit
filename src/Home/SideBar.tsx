import { Suspense } from "react";
import { from, map, switchMap } from "rxjs";
import { useStateObservable } from "../react-bindings";
import { API_URL, root } from "../root";

const tags$ = root.substate(() =>
  from(fetch(`${API_URL}/tags`)).pipe(
    switchMap((res) => res.json() as Promise<{ tags: string[] }>),
    map(({ tags }) => tags)
  )
);

const PopularTags = () => {
  const tags = useStateObservable(tags$);

  return (
    <div className="tag-list">
      {tags.map((tag, i) => (
        <a key={i} href="" className="tag-pill tag-default">
          {tag}
        </a>
      ))}
    </div>
  );
};

export const SideBar = () => (
  <div className="col-md-3">
    <div className="sidebar">
      <p>Popular Tags</p>

      <Suspense fallback={<div>Loading tags...</div>}>
        <PopularTags />
      </Suspense>
    </div>
  </div>
);
