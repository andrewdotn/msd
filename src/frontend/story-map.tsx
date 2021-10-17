import React from "react";
import { TaskNode } from "../task-node";
import { Status, Task } from "../models/task";
import { max } from "lodash";
import { Duration } from "../duration";

// Borrowing the term ‘track’ from css grid layout: the space between two lines,
// whether horizontal or vertical
class Track {
  readonly headingTask: TaskNode;
  tasks = new Set<number>();

  constructor(headingTask: TaskNode) {
    this.headingTask = headingTask;
  }

  add(task: TaskNode) {
    this.tasks.add(task.task.id!);
  }
}

class Row extends Track {}

class Column extends Track {}

function classNameForStatus(s: Status) {
  return Task.verboseStatus(s).replace(/ /g, "").toLowerCase();
}

function intersect<T>(a: Set<T>, b: Set<T>) {
  return new Set([...a].filter((e) => b.has(e)));
}

export function addBreakpoints(s?: string) {
  if (!s) {
    return s;
  }
  return s.replace(/([.\/_])/g, "$1\u200b");
}

class StoryMap {
  private _rows: TaskNode[];
  private _columns: TaskNode[];
  // task id → TaskNode
  private _taskLookup = new Map<number, TaskNode>();
  private _tasksAtCell: number[][][] = [];
  private _taskIdsUsed = new Set<number>();

  constructor(rows: TaskNode[], columns: TaskNode[]) {
    this._rows = rows;
    this._columns = columns;

    this.arrange();
  }

  arrange() {
    for (const holder of [...this._rows, ...this._columns]) {
      for (const t of holder.allChildren()) {
        this._taskLookup.set(t.task.id!, t);
      }
    }

    const rows = [];
    const rowUnion = new Set<number>();
    for (const r of this._rows) {
      const track = new Row(r);
      rows.push(track);
      for (const task of r.allChildren()) {
        track.add(task);
        rowUnion.add(task.task.id!);
      }
    }

    const cols = [];
    const colUnion = new Set<number>();
    for (const c of this._columns) {
      const track = new Column(c);
      cols.push(track);
      for (const task of c.allChildren()) {
        track.add(task);
        colUnion.add(task.task.id!);
      }
    }

    for (const [i, r] of rows.entries()) {
      this._tasksAtCell[i] = [];
      for (const [j, c] of cols.entries()) {
        const tasks = [...intersect(r.tasks, c.tasks)];
        this._tasksAtCell[i][j] = tasks;
        for (const t of tasks) {
          this._taskIdsUsed.add(t);
        }
      }
      const extraByRow = [...r.tasks].filter(
        (id) => !colUnion.has(id) && !this._rows.find((t) => t.task.id! === id)
      );
      if (extraByRow.length > 0) {
        this._tasksAtCell[i][cols.length] = extraByRow;
      }
    }

    for (const [j, c] of cols.entries()) {
      const extraByCol = [...c.tasks].filter(
        (id) =>
          !rowUnion.has(id) && !this._columns.find((t) => t.task.id! === id)
      );
      if (extraByCol.length > 0) {
        if (!this._tasksAtCell[rows.length]) {
          this._tasksAtCell[rows.length] = [];
        }
        this._tasksAtCell[rows.length][j] = extraByCol;
      }
    }
  }

  entries() {
    const ret = [];
    for (let i = 0; i < this._rows.length + 1; i++) {
      for (let j = 0; j < this._columns.length + 1; j++) {
        ret.push(
          <div
            className="story-map__intersection-cell"
            style={{ gridRowStart: i + 2, gridColumnStart: j + 2 }}
          >
            {(this._tasksAtCell[i]?.[j] ?? []).map((id) => {
              const t = this._taskLookup.get(id)!;
              const modifier =
                "story-map__task__" + classNameForStatus(t.task.status!);
              return (
                <div className={`story-map__task ${modifier}`}>
                  <a href={`/tasks/${t.task.id}`}>{t.task.id!}</a>◆{" "}
                  {addBreakpoints(t.task.title)}
                  {this.renderEstimateMaybe(t.task.estimatedMinutes)}
                </div>
              );
            })}
          </div>
        );
      }
    }
    return ret;
  }

  colHeadings() {
    const ret = this._columns.map((c, i) => {
      const modifier = "story-map__task__" + classNameForStatus(c.task.status!);

      return (
        <div
          className={`story-map__column-header ${modifier}`}
          style={{ gridColumnStart: i + 2, gridRowStart: 1 }}
        >
          <a className="story-map__header-link" href={`/tasks/${c.task.id}`}>
            {addBreakpoints(c.task.title)}
          </a>
        </div>
      );
    });

    if (max(this._tasksAtCell.map((r) => r.length))! > this._columns.length) {
      ret.push(
        <div
          className="story-map__column-header story-map__column-header__other"
          style={{ gridColumnStart: this._columns.length + 2, gridRowStart: 1 }}
        >
          Unsorted
        </div>
      );
    }

    return ret;
  }

  renderEstimateMaybe(estimate?: number | null) {
    if (!estimate) {
      return;
    }
    const stringEstimate = new Duration(estimate).toString();
    return (
      <>
        <br />
        <span className="story-map__task-estimate">{stringEstimate}</span>
      </>
    );
  }

  rowHeadings() {
    const ret = this._rows.map((r, i) => {
      const modifier = "story-map__task__" + classNameForStatus(r.task.status!);

      let totalEstimate = 0;
      for (const j in this._tasksAtCell[i]) {
        for (const taskId of this._tasksAtCell[i][j]) {
          const t = this._taskLookup.get(taskId)!;
          if (t.task.estimatedMinutes != null) {
            totalEstimate += t.task.estimatedMinutes;
          }
        }
      }

      return (
        <div
          className={`story-map__row-header ${modifier}`}
          style={{ gridColumnStart: 1, gridRowStart: i + 2 }}
        >
          <a className="story-map__header-link" href={`/tasks/${r.task.id}`}>
            {addBreakpoints(r.task.title)}
            {this.renderEstimateMaybe(totalEstimate)}
          </a>
        </div>
      );
    });

    if (this._tasksAtCell.length > this._rows.length) {
      ret.push(
        <div
          className="story-map__row-header story-map__row-header__other"
          style={{ gridColumnStart: 1, gridRowStart: this._rows.length + 2 }}
        >
          Maybe someday
        </div>
      );
    }

    return ret;
  }
}

function generateMap(rowHolder: TaskNode, colHolder: TaskNode) {
  const storyMap = new StoryMap(
    rowHolder.copyOfChildren,
    colHolder.copyOfChildren
  );

  return (
    <div className="story-map">
      {storyMap.colHeadings()}
      {storyMap.rowHeadings()}
      {storyMap.entries()}
    </div>
  );
}

export function storyMapView(root: TaskNode) {
  const rowHolders = root.copyOfChildren.filter((t) => t.task.title === "Rows");
  const colHolders = root.copyOfChildren.filter(
    (t) => t.task.title === "Columns"
  );

  let map;
  if (rowHolders.length === 1 && colHolders.length === 1) {
    map = generateMap(rowHolders[0], colHolders[0]);
  } else {
    map =
      "Need exactly one child task named ‘Rows’ and exactly one named ‘Columns’";
  }

  return (
    <div>
      <h1>
        Map for <a href={`/tasks/${root.task.id!}`}>{root.task.id!}◆</a>{" "}
        {root.task.title}
      </h1>
      {map}
    </div>
  );
}
