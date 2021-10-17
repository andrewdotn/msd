import { Task } from "./models/task";
import { TaskLink } from "./models/task-link";
import { ParentedTaskNode, ROOT_TASK, TaskNode } from "./task-node";
import { logInfo } from "./log";
import { assertNotFalseNullOrUndefined } from "./assert";
import { In } from "typeorm";
import { loadTaskInfoMap } from "./info-map";

export class TaskManager {
  constructor() {
    this._rootNode = new TaskNode(ROOT_TASK);
  }

  createTaskNode({
    after,
    existingTask,
  }: { after?: ParentedTaskNode; existingTask?: Task } = {}): ParentedTaskNode {
    const t = existingTask ? existingTask : new Task();
    const l = new TaskLink();
    l.parentTask = ROOT_TASK;
    l.childTask = t;

    let index: number | undefined;
    let newParent: TaskNode;
    if (after) {
      assertNotFalseNullOrUndefined(
        after.parent,
        "tried to insert after orphan node"
      );
      newParent = after.parent;
      index = newParent.indexOf(after) + 1;
    } else {
      newParent = this._rootNode;
    }

    if (index !== undefined) {
      return newParent.insertChild(t, index);
    } else {
      return newParent.pushChild(t);
    }
  }

  async loadFromDatabase(rootTaskId?: number, openOnly = false) {
    logInfo("Loading links");

    if (!rootTaskId && rootTaskId !== 0) {
      rootTaskId = ROOT_TASK.id;
    }

    let gatheredLinks: TaskLink[] = [];
    const gatheredTasks: Task[] = [];

    const tasksToGet = new Set<number>([rootTaskId!]);
    const tasksById = new Map<number, Task>();

    do {
      // sqlite supports a maximum of 999 parameters in a statement
      const tasksThisBatch = [...tasksToGet].slice(0, 998);

      let tasks = await Task.find({
        where: { id: In(tasksThisBatch) },
      });
      for (const id of tasksThisBatch) {
        tasksToGet.delete(id);
      }

      for (let t of tasks) {
        tasksById.set(t.id!, t);
      }

      if (openOnly) {
        tasks = tasks.filter((t) => t.isOpen());
      }

      for (let t of tasks) {
        gatheredTasks.push(t);
      }

      const links = await TaskLink.find({
        where: { parentTaskId: In(tasks.map((t) => t.id)) },
      });

      for (let l of links) {
        gatheredLinks.push(l);
        if (!tasksById.has(l.childTaskId!)) {
          tasksToGet.add(l.childTaskId!);
        }
      }
    } while (tasksToGet.size > 0);

    if (openOnly) {
      gatheredLinks = gatheredLinks.filter((l) =>
        tasksById.get(l.childTaskId!)!.isOpen()
      );
    }

    return (this._rootNode = TaskNode.assemble(
      gatheredTasks,
      gatheredLinks,
      await loadTaskInfoMap(),
      rootTaskId!
    ));
  }

  tasks() {
    return this._rootNode.allChildren();
  }

  count() {
    return Array.from(this._rootNode.allChildren()).length;
  }

  private _rootNode: TaskNode;
}
