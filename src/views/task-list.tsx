import React, { Component, Fragment } from "react";
import { DateView } from "./date";
import { TaskNode } from "../task-node";
import { TaskDetailInfoMap } from "../info-map";

function range(n: number) {
  return [...Array(n).keys()];
}

export class TaskListTable extends Component<{
  root: TaskNode;
  infoMap: TaskDetailInfoMap;
}> {
  render() {
    const childRows: JSX.Element[] = [];
    for (const t of this.props.root.allChildren()) {
      const info = this.props.infoMap.get(t.task.id!);
      childRows.push(
        <Fragment>
          <div className="tasklist__cell tasklist__task">
            <Fragment>
              {range(t.depth).map(() => (
                <span className="tasklist__spacer"></span>
              ))}
            </Fragment>
            <span>[{t.task.status}]</span>{" "}
            <a className="tasklist__task_link" href={`/tasks/${t.task.id}`}>
              {t.title}
            </a>
          </div>
          <div className="tasklist__cell tasklist__date">
            {info?.hasDescription && "D"}
            {info?.hasComments && "C"}
          </div>
          <div className="tasklist__cell">{t.task.estimate()}</div>
          <div className="tasklist__cell tasklist__date">
            <DateView abbreviate={true} date={t.task.createdAt} />
          </div>
          <div className="tasklist__cell tasklist__date">
            <DateView abbreviate={true} date={t.task.updatedAt} />
          </div>
        </Fragment>
      );
    }

    return (
      <div className="tasklist5">
        <div className="tasklist__header">Task</div>
        <div className="tasklist__header"></div>
        <div className="tasklist__header">Estimate</div>
        <div className="tasklist__header">Created</div>
        <div className="tasklist__header">Updated</div>
        {childRows}
      </div>
    );
  }
}
