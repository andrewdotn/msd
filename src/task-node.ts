import { Task } from "./models/task";
import { TaskLink } from "./models/task-link";
import { logInfo } from "./log";
import { sortBy } from "lodash";
import { inspect } from "util";
import { assertNotFalseNullOrUndefined } from "./assert";
import { PrioritizedList } from "./prioritized-list";
import { TaskDetailInfoMap } from "./info-map";

export const ROOT_TASK = new Task();
ROOT_TASK.id = 0;
ROOT_TASK.title = "Root";
let rootTaskSaved = false;

// Only the root node doesn’t have a parent link. Most consumers won’t use that,
// so this interface helps avoid some checks for whether the node has a parent
// or not.
export interface ParentedTaskNode extends TaskNode {
  parentLink: TaskLink;
  parent: TaskNode;
}

export function appendToMapList<K, V>(m: Map<K, V[]>, k: K, v: V) {
  if (!m.has(k)) {
    m.set(k, []);
  }
  m.get(k)!.push(v);
}

/**
 * Node in the task graph: task itself, parent parentLink, and child links.
 */
export class TaskNode {
  constructor(
    task: Task,
    link?: TaskLink,
    { taskHasComments }: { taskHasComments?: boolean } = {}
  ) {
    this.task = task;
    this.parentLink = link;
    if (taskHasComments) {
      this.taskHasComments = true;
    }

    assertNotFalseNullOrUndefined(this.task, "given null task");

    if (this.parentLink) {
      assertNotFalseNullOrUndefined(
        this.task === this.parentLink.childTask,
        "task is not parent’s child"
      );
    }
  }

  static create(
    task: Task,
    link: TaskLink,
    { taskHasComments }: { taskHasComments?: boolean } = {}
  ): ParentedTaskNode {
    const ret = new TaskNode(task, link, { taskHasComments });
    assertNotFalseNullOrUndefined(
      ret.parentLink,
      "tried to create ParentedTaskNode without parent"
    );
    return <ParentedTaskNode>ret;
  }

  /* Build out the graph from the given items */
  static assemble(
    tasks: Task[],
    links: TaskLink[],
    infoMap?: TaskDetailInfoMap,
    rootTaskId?: number
  ): TaskNode {
    const unused: Set<Task | TaskLink> = new Set();
    tasks = tasks.slice();

    if (rootTaskId === undefined) {
      rootTaskId = ROOT_TASK.id;
    }

    let root: TaskNode;
    const existingRootIndex = tasks.findIndex((t) => t.id === rootTaskId);
    if (existingRootIndex < 0) {
      if (rootTaskId === ROOT_TASK.id) {
        root = new TaskNode(ROOT_TASK);
      } else {
        throw new Error("attempted to use different root without providing it");
      }
    } else {
      root = new TaskNode(tasks.splice(existingRootIndex, 1)[0]);
    }

    const tasksById: Map<number, Task> = new Map();
    tasksById.set(root.task.id!, root.task);
    for (const t of tasks) {
      unused.add(t);

      assertNotFalseNullOrUndefined(t.id, "task with no id");
      tasksById.set(t.id, t);
    }

    const linksByParent: Map<number, TaskLink[]> = new Map();
    for (const l of links) {
      unused.add(l);

      assertNotFalseNullOrUndefined(l.parentTaskId, "link has empty parent id");
      appendToMapList(linksByParent, l.parentTaskId, l);
    }

    this.assemble1(root, unused, tasksById, linksByParent, infoMap);

    assertNotFalseNullOrUndefined(
      unused.size === 0,
      `${unused.size} unused database items remaining after assembly`,
      () => {
        logInfo(`${unused.size} items:`);
        for (const n of unused.values()) {
          logInfo(inspect(n));
        }
      }
    );

    return root;
  }

  // Recursive assembly helper
  private static assemble1(
    node: TaskNode,
    unused: Set<Task | TaskLink>,
    tasksById: Map<number, Task>,
    linksByParent: Map<number, TaskLink[]>,
    infoMap?: TaskDetailInfoMap
  ) {
    const id = node.task.id;
    assertNotFalseNullOrUndefined(id, "task has no id");

    let links = linksByParent.get(id) ?? [];
    links = sortBy(links, ["priority"]);
    for (const l of links) {
      if (l.parentTask === undefined) {
        l.parentTask = tasksById.get(l.parentTaskId!);
      }
      if (l.childTask === undefined) {
        l.childTask = tasksById.get(l.childTaskId!)!;
      }
      let hasComments = {} as { taskHasComments?: boolean };
      if (infoMap && infoMap.get(l.childTaskId!)?.hasComments) {
        hasComments.taskHasComments = true;
      }
      const childNode = TaskNode.create(l.childTask, l, hasComments);
      const priority = childNode.priority;
      node.pushChild(childNode);
      childNode.priority = priority;
      unused.delete(l.childTask);
      unused.delete(l);

      this.assemble1(childNode, unused, tasksById, linksByParent, infoMap);
    }
  }

  indexOf(node: ParentedTaskNode) {
    return this._children.indexOf(node);
  }

  get priority(): number | undefined {
    return this.parentLink?.priority;
  }
  set priority(priority: number | undefined) {
    assertNotFalseNullOrUndefined(
      this.parentLink,
      "tried to set priority on orphan task"
    );
    this.parentLink.priority = priority;
  }

  get childCount() {
    return this._children.length;
  }

  findChild(t: Task): TaskNode | null {
    if (t === this.task) {
      return this;
    }
    for (const c of this._children) {
      const ret = c.findChild(t);
      if (ret) {
        return ret;
      }
    }
    return null;
  }

  displayString() {
    let str = this.task.displayString();

    let markerString = "";
    if (this.taskHasComments && this.task.description) {
      markerString = ":";
    } else if (this.taskHasComments) {
      markerString = "·";
    } else if (this.task.description) {
      markerString = ".";
    }

    if (markerString) {
      str = str.substring(0, 3) + markerString + str.substring(4);
    }
    str = "    ".repeat(Math.max(0, this.depth)) + str;
    str = str.substr(0, 80);
    const estimate = this.task.estimate();
    if (estimate) {
      const windowWidth = 80;
      str = str.padEnd(windowWidth);
      str =
        str.substring(0, windowWidth - (estimate.length + 1)) + " " + estimate;
    }
    return str;
  }

  get depth() {
    let ret = 0;
    let topmostParent: TaskNode | undefined;
    for (
      let node: TaskNode | undefined = this.parent;
      node;
      node = node.parent
    ) {
      ret++;
      topmostParent = node;
    }
    // The root task is never displayed, so we don’t need an extra level of
    // indent below it.
    if (topmostParent?.task.id === ROOT_TASK.id) {
      ret--;
    }
    return ret;
  }

  get title() {
    return this.task.title;
  }
  set title(title: string | undefined) {
    this.task.title = title;
  }

  /** Return a copy of the child list */
  get copyOfChildren() {
    return this._children.asArray();
  }

  /* * Includes this, unless this is root. That’s what’s usually wanted for
   * display. */
  *allChildren(): Iterable<ParentedTaskNode> {
    if (this.task.id !== ROOT_TASK.id) {
      const this_ = this as ParentedTaskNode;
      yield this_;
    }
    for (const c of this._children) {
      yield* c.allChildren();
    }
  }

  async save() {
    logInfo(
      `Saving task + info ${this.task.id}; ${inspect(this.task)}, ${inspect(
        this.parentLink
      )}`
    );
    if (!rootTaskSaved) {
      await ROOT_TASK.save();
    }
    await this.task.save();
    await this.parentLink!.save();
  }

  insertChild(taskOrTaskNode: ParentedTaskNode | Task, index: number) {
    let taskNode: ParentedTaskNode;
    if (taskOrTaskNode instanceof Task) {
      const task = taskOrTaskNode;
      const link = new TaskLink();
      link.parentTask = this.task;
      link.parentTask.id = this.task.id;
      link.childTask = task;
      link.childTask.id = task.id;
      taskNode = TaskNode.create(task, link);
    } else {
      taskNode = taskOrTaskNode;
    }
    taskNode.parent = this;
    this._children.insert(taskNode, index);
    taskNode.parentLink.parentTask = this.task;
    taskNode.parentLink.parentTaskId = this.task.id;

    return taskNode;
  }

  pushChild(taskOrTaskNode: ParentedTaskNode | Task) {
    return this.insertChild(taskOrTaskNode, this._children.length);
  }

  private _indexInParent() {
    assertNotFalseNullOrUndefined(this.parent, "tried to find index of orphan");
    const parentedThs = this as ParentedTaskNode;
    return this.parent.indexOf(parentedThs);
  }

  move(number: number) {
    assertNotFalseNullOrUndefined(this.parent, "cannot move orphan");
    const parent = this.parent;
    const index = parent.indexOf(this as ParentedTaskNode);
    const newIndex = index + number;

    if (newIndex < 0) {
    } else if (newIndex >= parent.childCount) {
    } else {
      parent._children.move(index, number);
    }
  }

  increaseDepth() {
    assertNotFalseNullOrUndefined(
      this.parent,
      "can’t increase depth of orphan"
    );

    const index = this._indexInParent();
    if (index !== 0) {
      const removed = this.parent._children.delete(index);
      const newParent = this.parent._children.get(index - 1)!;
      newParent.pushChild(removed);
    }
  }

  decreaseDepth() {
    assertNotFalseNullOrUndefined(
      this.parent,
      "can’t decrease depth of orphan"
    );
    assertNotFalseNullOrUndefined(
      this.parent.parent,
      "can’t decrease depth of child of orphan"
    );

    const myIndex = this._indexInParent();
    const newIndex = this.parent._indexInParent() + 1;
    this.parent._children.delete(myIndex);
    this.parent.parent.insertChild(this as ParentedTaskNode, newIndex);
  }

  removeFromTree() {
    assertNotFalseNullOrUndefined(
      this.task?.id === undefined,
      "tried deleting saved task"
    );
    assertNotFalseNullOrUndefined(this.parent, "tried removing orphan task");
    const parentedThis = this as ParentedTaskNode;
    this.parent._children.delete(this.parent._children.indexOf(parentedThis));
  }

  async removeFromTreeAndLinkFromDb() {
    assertNotFalseNullOrUndefined(
      this.hasDuplicateElsewhereInTree(),
      "only copy of node"
    );
    assertNotFalseNullOrUndefined(this.parent, "tried removing orphan task");
    const parentedThis = this as ParentedTaskNode;
    this.parent._children.delete(this.parent._children.indexOf(parentedThis));
    await this.parentLink?.remove();
  }

  /** Is there another TaskNode for the same task, but with different parents? */
  hasDuplicateElsewhereInTree() {
    let topParent: TaskNode = this;
    while (topParent.parent) {
      topParent = topParent.parent;
    }

    logInfo(`top parent is ${topParent.task.title}`);

    return this.hasDuplicateElsewhereInTree1(topParent);
  }

  // Recursive helper
  private hasDuplicateElsewhereInTree1(node: TaskNode) {
    if (node === this) {
      return false;
    }

    if (node.task === this.task) {
      return true;
    }

    for (const c of node._children) {
      if (this.hasDuplicateElsewhereInTree1(c)) {
        return true;
      }
    }
    return false;
  }

  readonly task: Task;
  readonly taskHasComments?: boolean;
  parent?: TaskNode;
  parentLink?: TaskLink;
  private _children = new PrioritizedList<ParentedTaskNode>();
}
