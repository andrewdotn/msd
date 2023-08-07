import blessed, { Widgets } from "blessed";
import { TaskManager } from "./task-manager";
import { ParentedTaskNode } from "./task-node";
import { assertNotFalseNullOrUndefined } from "./assert";

type IKeyEventArg = Widgets.Events.IKeyEventArg;

export class TaskListWidget {
  constructor(screen: Widgets.Screen, taskManager: TaskManager) {
    screen = screen;
    this.taskManager = taskManager;

    this.taskItems = blessed.list({
      style: {
        selected: {
          bg: 253,
        },
      },
      top: 0,
      bottom: 1,
      items: [],
      keys: true,
      mouse: true,
    });
    screen.append(this.taskItems);

    this.taskItems.on("keypress", (ch, key) => {
      if (ch === "j") {
        this.taskItems.down(1);
      } else if (ch === "k") {
        this.taskItems.up(1);
      }

      for (const l of this.keyPressListeners) {
        l(ch, key);
      }
    });
  }

  focus() {
    this.taskItems.focus();
  }

  down(count: number) {
    this.taskItems.down(count);
  }

  up(count: number) {
    this.taskItems.up(count);
  }

  downSkippingDeeperTasks() {
    if (!this.getSelectedTask()) {
      return;
    }
    const tasks = [...this.taskManager.tasks()];

    if (this.taskManager.count() <= 0) {
      return;
    }

    const t = tasks[this.taskItems.selected];
    for (let i = this.taskItems.selected + 1; i < tasks.length; i++) {
      if (tasks[i].depth <= t.depth) {
        this.setSelection(i);
        break;
      }
    }
  }

  upSkippingDeeperTasks() {
    if (!this.getSelectedTask()) {
      return;
    }
    const tasks = [...this.taskManager.tasks()];

    if (this.taskManager.count() <= 0) {
      return;
    }

    const t = tasks[this.taskItems.selected];
    for (let i = this.taskItems.selected - 1; i >= 0; i--) {
      if (tasks[i].depth <= t.depth) {
        this.setSelection(i);
        break;
      }
    }
  }

  getSelectedTask(): ParentedTaskNode | undefined {
    if (this.taskManager.count() > 0) {
      return Array.from(this.taskManager.tasks())[this.taskItems.selected];
    } else {
      return;
    }
  }

  getSelectedTaskIndex(): number | undefined {
    if (this.taskManager.count() > 0) {
      return this.taskItems.selected;
    }
    return undefined;
  }

  setSelection(index: number) {
    assertNotFalseNullOrUndefined(
      index >= 0 && index < this.taskManager.count(),
      "out of range"
    );
    this.taskItems.select(index);
  }

  update(taskToSelect?: ParentedTaskNode) {
    const updated = Array.from(this.taskManager.tasks());
    this.taskItems.setItems(updated.map((t) => t.displayString()));
    if (taskToSelect) {
      const index = updated.indexOf(taskToSelect);
      if (index > 0) {
        this.taskItems.select(index);
      }
    }
  }

  onKeypress(func: (ch: string, key: IKeyEventArg) => void) {
    this.keyPressListeners.push(func);
  }

  private keyPressListeners: ((ch: string, key: IKeyEventArg) => void)[] = [];
  private taskItems: Widgets.ListElement;
  taskManager: TaskManager;
}
