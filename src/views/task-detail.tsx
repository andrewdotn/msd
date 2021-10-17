import React, { ReactNode } from "react";
import { Status, Task } from "../models/task";
import { TaskStatusHistory } from "../models/task-status-history";
import { DateView } from "./date";
import { ROOT_TASK, TaskNode } from "../task-node";
import { TaskListTable } from "./task-list";
import { TaskLink } from "../models/task-link";
import { TaskHistory, TaskHistoryChangeItem } from "../models/task-history";
import { Duration } from "../duration";
import { TaskDetailInfoMap } from "../info-map";

export function TaskDetail({
  task,
  statusHistory,
  taskHistory,
  parentLinks,
  parentTaskInfo,
  childTasks,
  infoMap,
}: {
  task: Task;
  statusHistory?: TaskStatusHistory[];
  taskHistory?: TaskHistory[];
  parentLinks: TaskLink[];
  parentTaskInfo: Map<number, Task>;
  childTasks?: TaskNode;
  infoMap: TaskDetailInfoMap;
}) {
  const status = Task.verboseStatus(task.status!);

  const hasMap =
    childTasks?.copyOfChildren.find((t) => t.title === "Rows") &&
    childTasks?.copyOfChildren.find((t) => t.title === "Columns");

  const sections: ReactNode[] = [];

  const uniqueTaskCount = new Set(
    [...(childTasks?.allChildren() ?? [])].map((t) => t.task.id)
  ).size;
  const doneTaskCount = new Set(
    [...(childTasks?.allChildren() ?? [])]
      .filter((t) => t.task.status === "x")
      .map((t) => t.task.id)
  ).size;
  const cancelledTaskCount = new Set(
    [...(childTasks?.allChildren() ?? [])]
      .filter((t) => t.task.status === "-")
      .map((t) => t.task.id)
  ).size;

  sections.push(
    <div>
      <h1>
        <span className="taskdetail__id">{task.id}◆</span> {task.title}
      </h1>
      {hasMap && <a href={`/map/${task.id}`}>Story map</a>}
      <h2>{status}</h2>
      <h3>
        Estimated time:{" "}
        {task.estimatedMinutes == undefined
          ? "?"
          : new Duration(task.estimatedMinutes).toString()}
      </h3>
      <div>
        Created <DateView date={task.createdAt} />
      </div>
      <div>
        Last Updated <DateView date={task.updatedAt} />
      </div>
      <h3>Description</h3>
      <pre>{task.description}</pre>
      <h3>Comments</h3>
      {(task.comments ?? []).map((c) => (
        <div>
          Comment {c.id} at <DateView date={c.createdAt} />
          <pre>{c.text}</pre>
        </div>
      ))}
      <form method="POST" action={`/tasks/${task.id}/comment`}>
        <div className="form__control">
          <textarea className="form__input" name="comment" rows={3} />
        </div>
        <button type="submit" className="tasknav__link">
          Add
        </button>
      </form>
    </div>
  );

  sections.push(
    <>
      <h3>Parents</h3>
      <ul>
        {parentLinks.map((l) => {
          let link, linkText: string;
          if (l.parentTaskId === ROOT_TASK.id) {
            link = "/tasks";
            linkText = "Root";
          } else {
            link = `/tasks/${l.parentTaskId}`;
            linkText = parentTaskInfo.get(l.parentTaskId!)?.title!;
          }
          return (
            <li key={l.id}>
              <a href={link} title={`Priority ${l.priority}`}>
                {linkText}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );

  function historyChangeItem(e: TaskHistoryChangeItem) {
    let before = JSON.parse(e.before);
    let after = JSON.parse(e.after);
    if (e.fieldName === "status") {
      before = Task.verboseStatus(before as Status);
      after = Task.verboseStatus(after as Status);
    }

    return (
      <React.Fragment key={e.fieldName}>
        <dt>{e.fieldName}</dt>
        <dd>
          {before} → {after}
        </dd>
      </React.Fragment>
    );
  }

  if (childTasks) {
    sections.push(
      <>
        <h3>Children</h3>
        <small>
          {uniqueTaskCount} unique, {doneTaskCount} done (
          {((doneTaskCount / uniqueTaskCount) * 100).toFixed(1)}%) ,{" "}
          {cancelledTaskCount} (
          {((cancelledTaskCount / uniqueTaskCount) * 100).toFixed(1)}%)
          cancelled
        </small>
        <TaskListTable root={childTasks} infoMap={infoMap} />
      </>
    );
  }

  if (taskHistory && taskHistory.length > 0) {
    sections.push(
      <>
        <h3>Task history</h3>
        <table>
          <thead>
            <tr>
              <th>Change</th>
              <th>At</th>
            </tr>
          </thead>
          <>
            {taskHistory.map((h) => {
              const changes = h.getChanges();
              if (!changes) return;

              return (
                <tr key={h.id}>
                  <td>
                    <dl>{changes.map(historyChangeItem)}</dl>
                  </td>
                  <td>
                    <DateView date={h.changeTime} />
                  </td>
                </tr>
              );
            })}
          </>
        </table>
      </>
    );
  }

  if (statusHistory && statusHistory.length > 0) {
    sections.push(
      <>
        <h3>Status history</h3>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Until</th>
            </tr>
          </thead>
          <>
            {statusHistory.map((s) => (
              <tr>
                <td>{Task.verboseStatus(s.status!)}</td>
                <td>
                  <DateView date={s.endTime} />
                </td>
              </tr>
            ))}
          </>
        </table>
      </>
    );
  }

  return <>{sections}</>;
}
