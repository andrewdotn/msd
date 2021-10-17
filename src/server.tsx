import { join as joinpath } from "path";
import express from "express";
import "express-async-errors";
import bodyParser from "body-parser";
import morgan from "morgan";
import React from "react";
import { i } from "./i";
import { Status, Task } from "./models/task";
import { fullHtmlDocumentWithBody } from "./html";
import { TaskListTable } from "./views/task-list";
import { TaskStatusHistory } from "./models/task-status-history";
import { TaskDetail } from "./views/task-detail";
import { editTask } from "./controllers/task-edit";
import { parseIntMaybe, saferParseInt } from "./util/safer-parse-int";
import { TaskNav } from "./views/task-nav";
import { TaskLog } from "./views/task-log";
import { TaskManager } from "./task-manager";
import { TaskLink } from "./models/task-link";
import { In } from "typeorm";
import { storyMap } from "./story-map";
import { TaskHistory } from "./models/task-history";
import { commentOnTask } from "./controllers/task-comment-responder";
import { TaskComment } from "./models/task-comment";
import { DateView } from "./views/date";
import { badRequest, isStringOrUndefined } from "./controllers/util";
import { loadTaskInfoMap } from "./info-map";

// https://stackoverflow.com/a/48794739/14558
export function isPromise<T>(val: Promise<T> | T): val is Promise<T> {
  return val && (val as Promise<T>).then !== undefined;
}

export async function serve({ port }: { port?: number }) {
  const app = express();

  app.use(morgan("dev"));

  app.use(bodyParser.urlencoded());
  app.use(bodyParser.json());

  app.use(express.static(joinpath(__dirname, "public")));

  app.get("/tasks/:taskId(\\d+).json", async (req, res) => {
    const taskId: number = saferParseInt(req.params.taskId);
    const t = await Task.findOneOrFail({ id: taskId });
    const statusHistory = await TaskStatusHistory.find({ taskId });
    res.setHeader("Content-Type", "text/plain");
    res.send(JSON.stringify({ task: t, statusHistory }, null, 2));
  });

  app.get("/tasks/:taskId(\\d+)", async (req, res) => {
    const taskId: number = saferParseInt(req.params.taskId);
    const t = await Task.findOneOrFail(
      { id: taskId },
      { relations: ["comments"] }
    );
    const statusHistory = await TaskStatusHistory.find({ taskId });
    const taskHistory = await TaskHistory.find({ taskId });
    const children = await new TaskManager().loadFromDatabase(
      t.id,
      !!req.query.openOnly
    );
    const parentLinks = await TaskLink.find({
      where: { childTaskId: t.id },
    });
    const parentTaskInfo = new Map<number, Task>();
    const parentTasks = await Task.find({
      where: { id: In(parentLinks.map((l) => l.parentTaskId)) },
    });
    for (const p of parentTasks) {
      parentTaskInfo.set(p.id!, p);
    }

    res.send(
      fullHtmlDocumentWithBody(
        <TaskNav
          url={req.url}
          taskId={t.id}
          extraNav={[{ href: `/tasks/${taskId}/edit`, title: "Edit" }]}
        >
          <TaskDetail
            task={t}
            parentLinks={parentLinks}
            parentTaskInfo={parentTaskInfo}
            statusHistory={statusHistory}
            taskHistory={taskHistory}
            childTasks={children.childCount > 0 ? children : undefined}
            infoMap={await loadTaskInfoMap()}
          />
        </TaskNav>,
        undefined,
        [],
        ["/style.css"]
      )
    );
  });

  app.get("/tasks/new", editTask);
  app.post("/tasks/new", editTask);

  app.get("/tasks/:taskId(\\d+)/edit", editTask);
  app.post("/tasks/:taskId(\\d+)/edit", editTask);

  app.post("/tasks/:taskId(\\d+)/comment", commentOnTask);

  app.get("/tasks", async (req, res) => {
    const t = new TaskManager();
    if (!isStringOrUndefined(req.query.root)) {
      return badRequest(res);
    }
    const [givenRootId, rootId] = parseIntMaybe(req.query.root);
    console.log({ openOnly: req.query.openOnly });
    if (!isStringOrUndefined(req.query.openOnly)) {
      return badRequest(res);
    }
    const openOnly = req.query.openOnly ?? false;
    const taskNodeRoot = await t.loadFromDatabase(
      givenRootId ? rootId : undefined,
      !!openOnly
    );

    const infoMap = await loadTaskInfoMap();

    res.send(
      fullHtmlDocumentWithBody(
        <TaskNav url={req.url}>
          <TaskListTable root={taskNodeRoot} infoMap={infoMap} />
        </TaskNav>,
        undefined,
        [],
        ["/style.css"]
      )
    );
  });

  app.get("/comments", async (req, res) => {
    const comments = await TaskComment.find({
      order: { createdAt: "ASC" },
      relations: ["task"],
    });
    res.send(
      fullHtmlDocumentWithBody(
        <TaskNav url={req.url}>
          <h1>Comments</h1>
          {comments.map((c) => {
            return (
              <div key={c.id}>
                <div>
                  <DateView date={c.createdAt} /> on{" "}
                  <a href={`/tasks/${c.taskId}`}>
                    {c.taskId}◆ {c.task!.title}
                  </a>
                </div>
                <pre>{c.text}</pre>
              </div>
            );
          })}
        </TaskNav>,
        undefined,
        [],
        ["/style.css"]
      )
    );
  });

  app.get("/tasks/log", async (req, res) => {
    const [tasks, statusHistory] = await Promise.all([
      Task.find(),
      TaskStatusHistory.find(),
    ]);

    res.send(
      fullHtmlDocumentWithBody(
        <TaskNav url={req.url}>
          <TaskLog tasks={tasks} statusHistory={statusHistory} />
        </TaskNav>,
        undefined,
        [],
        ["/style.css"]
      )
    );
  });

  function get(
    route: string,
    func: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => unknown
  ) {
    app.get(route, (req, res, next) => {
      const ret = func(req, res, next);
      if (isPromise(ret)) {
        ret.catch(next);
      }
    });
  }

  get("/map/:taskId(\\d+)", storyMap);

  app.get("/tasks/stats", async (req, res) => {
    const stats = (await Task.query(`
      SELECT status, COUNT(*) as count
      FROM task
      GROUP BY status
      ORDER BY 2 DESC
      `)) as { status: Status; count: number }[];

    const total = stats.reduce((acc, v) => acc + v.count, 0);

    res.send(
      fullHtmlDocumentWithBody(
        <TaskNav url={req.url}>
          <h1>Stats</h1>
          <p>
            This is from a very basic SQL query, where open subtasks of
            cancelled tasks are still counted as open.
          </p>
          <table>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>%</th>
            </tr>
            <tr>
              <td>Total</td>
              <td>{total}</td>
              <td></td>
            </tr>
            {stats.map((s, index) => (
              <tr key={index}>
                <td>{Task.verboseStatus(s.status)}</td>
                <td>{s.count}</td>
                <td>{((s.count / total) * 100).toFixed(1)}</td>
              </tr>
            ))}
          </table>
        </TaskNav>,
        undefined,
        [],
        ["/style.css"]
      )
    );
  });

  function listenMaybeWithPort(cb: () => void) {
    if (port !== undefined) {
      return app.listen(port, cb);
    } else {
      return app.listen(cb);
    }
  }

  const server = listenMaybeWithPort(() => {
    console.log(i`now listening on ${server.address()}`);
  });
}
