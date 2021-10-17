import blessed, { Widgets } from "blessed";
import { inspect } from "util";
import { LogWidget } from "./log-widget";
import { MainWindow } from "./main-window";
import { TitleEditor } from "./title-editor";
import { TaskManager } from "./task-manager";
import { TaskListWidget } from "./task-list-widget";
import { ParentedTaskNode } from "./task-node";
import yargs from "yargs";
import { getConnection } from "./db";
import { serve } from "./server";
import { logInfo } from "./log";
import { parseIntMaybe } from "./util/safer-parse-int";

type ArgvOptions = {
  database?: string;
  port?: number;
  rootTaskId?: number;
  file?: string;
};

let screen: Widgets.Screen;

type CliCommandName = "serve" | "tui";

async function main() {
  // https://github.com/microsoft/TypeScript/issues/11498#issuecomment-550552965
  let cliCommand: CliCommandName = "tui" as CliCommandName;
  const argv = yargs
    .strict()
    .demandCommand(0, 1)
    .command(
      ["tui", "$0"],
      "Terminal UI [default]",
      (args) => {
        return args.option("root-task-id", { type: "number" });
      },
      () => (cliCommand = "tui")
    )
    .command(
      "serve",
      "Start web server",
      (args) => {
        return args.option("port", { type: "number" });
      },
      () => (cliCommand = "serve")
    )
    .option("database", { type: "string" }).argv as ArgvOptions;

  if (cliCommand === "serve") {
    await getConnection(argv);
    return serve(argv);
  }

  let taskManager = new TaskManager();

  const taskLoadPromise = (async () => {
    await getConnection(argv);
    await taskManager.loadFromDatabase(argv.rootTaskId);
  })();

  screen = blessed.screen({
    smartCSR: true,
    autoPadding: true,
  });

  new MainWindow(screen);
  screen.title = "msd";

  let taskView = new TaskListWidget(screen, taskManager);

  const log = new LogWidget(screen);
  log.append();

  taskView.focus();

  const editor = new TitleEditor(screen, { remindAboutEditor: true });
  let taskBeingEdited: ParentedTaskNode | undefined;

  let yankedTask: ParentedTaskNode | undefined;

  editor.onSubmit(async () => {
    editor.hide();
    taskView.focus();
    if (taskBeingEdited) {
      if (editor.content !== "") {
        taskBeingEdited.title = editor.content;
        await taskBeingEdited.save();
        taskView.update();
        taskView.down(1);
      } else {
        // Delete incomplete task
        taskBeingEdited.removeFromTree();
      }
    }
    screen.render();
  });
  editor.onCancel(async () => {
    if (taskBeingEdited && taskBeingEdited.task.id === undefined) {
      taskBeingEdited.removeFromTree();
    }
  });

  /**
   * Return whether `target` contains `pattern`, doing the search
   * case-insensitively unless pattern contains uppercase characters.
   */
  function smartIncludes(target: string, pattern: string) {
    if (pattern === pattern.toLowerCase()) {
      target = target.toLowerCase();
    }
    return target.includes(pattern);
  }

  function runSearch() {
    if (searchField.content === "") {
      return;
    }

    const tasks = [...taskManager.tasks()];
    const selectedIndex = taskView.getSelectedTaskIndex();
    if (selectedIndex === undefined) {
      return;
    }

    for (let offset = 1; offset < tasks.length; offset++) {
      const i = (selectedIndex + offset) % tasks.length;
      const t = tasks[i];

      if (smartIncludes(t.title ?? "", searchField.content)) {
        taskView.setSelection(i);
        break;
      }
    }
  }

  const searchField = new TitleEditor(screen);
  searchField.description = "Search";
  searchField.onSubmit(() => {
    searchField.hide();
    runSearch();
  });

  const gotoField = new TitleEditor(screen);
  gotoField.description = "Goto by ID";
  gotoField.onSubmit(() => {
    gotoField.hide();

    const [valid, number] = parseIntMaybe(gotoField.content);
    if (!valid) {
      return;
    }

    const tasks = [...taskManager.tasks()];
    const selectedIndex = taskView.getSelectedTaskIndex();
    if (selectedIndex === undefined) {
      return;
    }

    for (let offset = 1; offset < tasks.length; offset++) {
      const i = (selectedIndex + offset) % tasks.length;
      const t = tasks[i];

      if (t.task.id! === number) {
        taskView.setSelection(i);
        break;
      }
    }
  });

  await taskLoadPromise;
  taskView.update();
  screen.render();

  let openOnly = false;

  async function reloadTasks() {
    taskManager = new TaskManager();
    await taskManager.loadFromDatabase(argv.rootTaskId, openOnly);
    taskView.taskManager = taskManager;
    taskView.update();
    screen.render();
  }

  taskView.onKeypress(async (ch, key) => {
    const task = taskView.getSelectedTask();
    if (key && key.full === "n") {
      taskBeingEdited = taskManager.createTaskNode({
        after: taskView.getSelectedTask(),
      });
      editor.description = `New task title`;
      editor.setValue("");
      editor.show();
      editor.focusPush();
    } else if (task && ch === "d") {
      task.task.toggle();
      await task.save();
      taskView.update();
    } else if (task && ch === "c") {
      task.task.toggleCancel();
      await task.save();
      taskView.update();
    } else if (task && ch === "/") {
      searchField.setValue("");
      searchField.show();
      searchField.focusPush();
    } else if (key && key.full === "tab") {
      runSearch();
    } else if (task && ch == "g") {
      gotoField.setValue("");
      gotoField.show();
      gotoField.focusPush();
    } else if (task && ch === "y") {
      // yank
      yankedTask = task;
    } else if (task && ch === "p") {
      // paste yanked task here
      if (
        !yankedTask ||
        yankedTask === task ||
        yankedTask.parent === task.parent
      ) {
        return;
      }

      const newLink = taskManager.createTaskNode({
        after: task,
        existingTask: yankedTask.task,
      });
      await newLink.save();
      taskView.update();
    } else if (task && ch === "m") {
      // move yanked task here
      if (
        !yankedTask ||
        yankedTask === task ||
        // We could translate this to a regular move, but for now bail.
        yankedTask.parent === task.parent
      ) {
        return;
      }

      const newTask = taskManager.createTaskNode({
        after: task,
        existingTask: yankedTask.task,
      });

      await newTask.parentLink.save();
      await yankedTask.removeFromTreeAndLinkFromDb();
      taskView.update();
    } else if (task && ch === "D") {
      // detach
      const res = task.hasDuplicateElsewhereInTree();
      logInfo(`Has duplicate? ${res}`);
      if (res) {
        await task.removeFromTreeAndLinkFromDb();
        taskView.update();
      }
    } else if (task && ch === "!") {
      task.task.startTask();
      await task.save();
      taskView.update();
    } else if (task && ch === "e") {
      taskBeingEdited = task;
      editor.description = `Editing task ${task.task.id} title`;
      editor.setValue(task.title!);
      editor.show();
      editor.focusPush();
    } else if (task && ch === "J") {
      task.move(1);
      await task.save();
      taskView.update();
    } else if (task && ch === "K") {
      task.move(-1);
      await task.save();
      taskView.update();
    } else if (key && key.full === "home") {
      if (taskManager.count() > 0) {
        taskView.setSelection(0);
      }
    } else if (key && key.full === "end") {
      const taskCount = taskManager.count();
      if (taskCount > 0) {
        taskView.setSelection(taskCount - 1);
      }
    } else if (key && (key.full === "C-d" || key.full === "pagedown")) {
      const taskCount = taskManager.count();
      if (taskCount === 0) {
        return;
      }

      const index = Math.min(
        taskView.getSelectedTaskIndex()! + (screen.height as number) - 2,
        taskCount - 1
      );
      if (index >= 0) {
        taskView.setSelection(index);
      }
    } else if (key && (key.full === "C-u" || key.full === "pageup")) {
      const taskCount = taskManager.count();
      if (taskCount === 0) {
        return;
      }

      const index = Math.min(
        taskView.getSelectedTaskIndex()! - (screen.height as number) + 2,
        taskCount - 1
      );
      if (index >= 0) {
        taskView.setSelection(index);
      }
    } else if (key && ch == "i") {
      // move up to next task at same depth
      taskView.upSkippingDeeperTasks();
    } else if (key && ch == ",") {
      // move down to next task at same depth
      taskView.downSkippingDeeperTasks();
    } else if (task && ch == ">") {
      task.increaseDepth();
      await task.save();
      taskView.update();
    } else if (task && ch == "<") {
      if (task.parent?.parent) {
        task.decreaseDepth();
        await task.save();
        taskView.update();
      }
    } else if (ch == "R") {
      await reloadTasks();
    } else if (key && key.full == "C-l") {
      // force full redraw of screen
      screen.realloc();
    } else if (ch == "o") {
      // toggle open-only
      openOnly = !openOnly;
      logInfo(`openOnly now ${openOnly}`);
      await reloadTasks();
    } else {
      logInfo(`Unknown key: ${inspect(ch)}, ${inspect(key)}`);
    }
    screen.render();
  });

  screen.on("keypress", (ch, key) => {
    if (ch === "q" || (key && key.full === "C-c")) {
      process.exit(0);
    }

    if (ch === "l") {
      log.toggle();
      if (log.visible) {
        log.focusPush();
      } else {
        screen.focusPop();
      }
    }

    screen.render();
  });
}

if (require.main === module) {
  main().catch((e) => {
    if (screen) {
      screen.destroy();
    }
    console.error(e);
    process.exit(1);
  });
}
