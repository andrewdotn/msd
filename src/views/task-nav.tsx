import React, { Fragment, PropsWithChildren } from "react";

/* Set value of key to 1 if not present, else remove. */
function toggleQs(url: string, key: string) {
  // A host is required, but will be immediately thrown away
  const searchParams = new URL(url, "https://example.org").searchParams;
  if (searchParams.has(key)) {
    searchParams.delete(key);
  } else {
    searchParams.set(key, "1");
  }
  return "?" + searchParams.toString();
}

export function TaskNav(
  props: PropsWithChildren<{
    url: string;
    extraNav?: { href: string; title: string }[];
    taskId?: number;
  }>
) {
  return (
    <Fragment>
      <nav className="tasknav">
        <a className="tasknav__link" href="/tasks">
          Tasks
        </a>
        <a className="tasknav__link" href={toggleQs(props.url, "openOnly")}>
          Open only
        </a>
        <a className="tasknav__link" href="/tasks/log">
          Task edit log
        </a>
        <a className="tasknav__link" href="/comments">
          Comments
        </a>
        <a
          className="tasknav__link"
          href={`/tasks/new${props.taskId ? `?parent=${props.taskId}` : ""}`}
        >
          New task
        </a>
        <a className="tasknav__link" href={`/tasks/stats`}>
          Stats
        </a>
        <Fragment>
          {(props.extraNav ?? []).map((l) => (
            <a className="tasknav__link" href={l.href}>
              {l.title}
            </a>
          ))}
        </Fragment>
      </nav>
      <div className="taskmain">
        <div className="taskmain__inner">{props.children}</div>
      </div>
    </Fragment>
  );
}
