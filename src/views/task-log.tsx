import React, { Fragment } from "react";
import { groupBy, sortBy, reverse } from "lodash";
import { TaskStatusHistory } from "../models/task-status-history";
import { Status, Task } from "../models/task";
import { DateView } from "./date";

class LogEntry {
  constructor(
    readonly taskId: number,
    readonly title: string,
    readonly when: Date,
    readonly message: string
  ) {}
}

export function TaskLog({
  tasks,
  statusHistory,
}: {
  tasks: Task[];
  statusHistory: TaskStatusHistory[];
}) {
  let entries: LogEntry[] = [];

  const taskInfo = new Map<number, Task>();
  for (const t of tasks) {
    entries.push(new LogEntry(t.id!, t.title!, t.createdAt!, `created`));
    taskInfo.set(t.id!, t);
  }

  const lastStatusHistoryTime = new Map<number, Date>();

  statusHistory = sortBy(statusHistory, (s) => s.endTime);
  const statusGroups = groupBy(statusHistory, (s) => s.taskId);
  for (const v of Object.values(statusGroups)) {
    const task = taskInfo.get(v[0].taskId!)!;
    for (let i = 0; i < v.length; i++) {
      let newStatus: Status;
      if (i < v.length - 1) {
        newStatus = v[i + 1].status!;
      } else {
        newStatus = task.status!;
        lastStatusHistoryTime.set(task.id!, v[i].endTime!);
      }

      entries.push(
        new LogEntry(
          task.id!,
          task.title!,
          v[i].endTime!,
          `${Task.verboseStatus(v[i].status!)} → ${Task.verboseStatus(
            newStatus
          )}`
        )
      );
    }
  }

  for (const t of tasks) {
    if (
      t.createdAt!.getTime() !== t.updatedAt!.getTime() &&
      t.updatedAt!.getTime() !== lastStatusHistoryTime.get(t.id!)?.getTime()
    ) {
      entries.push(
        new LogEntry(
          t.id!,
          t.title!,
          t.updatedAt!,
          `updated, status = ${Task.verboseStatus(t.status!)}`
        )
      );
    }
  }

  entries = reverse(sortBy(entries, (e) => e.when));

  return (
    <div className="tasklist3">
      <div className="tasklist__header">Date</div>
      <div className="tasklist__header">Task</div>
      <div className="tasklist__header">Action</div>
      <div className="tasklist__header"></div>
      <div className="tasklist__header"></div>
      {entries.map((e) => (
        <Fragment>
          <div className="tasklist__cell tasklist__date">
            <DateView date={e.when} />
          </div>
          <div className="tasklist__cell tasklist__task">
            <a href={`/tasks/${e.taskId}`}>{e.title}</a>
          </div>
          <div className="tasklist__cell">{e.message}</div>
          <div className="tasklist__cell"></div>
          <div className="tasklist__cell"></div>
        </Fragment>
      ))}
    </div>
  );
}
