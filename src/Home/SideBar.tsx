import { Suspense } from "react";
import { from, map, switchMap } from "rxjs";
import { useStateNode } from "@react-rxjs/context-state";
import { API_URL, root } from "../root";
import { Link } from "../router";
import { tagSignal } from "./Articles";

const tags$ = root.substate(() =>
  from(fetch(`${API_URL}/tags`)).pipe(
    switchMap((res) => res.json() as Promise<{ tags: string[] }>),
    map(({ tags }) => tags)
  )
);

const PopularTags = () => {
  const tags = useStateNode(tags$);

  return (
    <div className="tag-list">
      {tags.map((tag, i) => (
        <Link
          key={i}
          to=""
          className="tag-pill tag-default"
          onClick={() => tagSignal.push(tag)}
        >
          {tag}
        </Link>
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
