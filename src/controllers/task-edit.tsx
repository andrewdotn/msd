import express from "express";
import React from "react";
import { includes } from "lodash";
import { fullHtmlDocumentWithBody } from "../html";
import { Task } from "../models/task";
import { appendToMapList, ROOT_TASK } from "../task-node";
import { TaskLink } from "../models/task-link";
import { TaskCreate } from "../views/task-create";
import { saferParseInt } from "../util/safer-parse-int";
import { TaskNav } from "../views/task-nav";
import { Duration } from "../duration";
import { badRequest, isStringOrUndefined } from "./util";

export async function editTask(req: express.Request, res: express.Response) {
  let t: Task;
  if (req.params.taskId !== undefined) {
    t = await Task.findOneOrFail({ id: saferParseInt(req.params.taskId) });
  } else {
    t = new Task();
  }

  let parentTask = ROOT_TASK;
  if (!isStringOrUndefined(req.query.parent)) {
    return badRequest(res);
  }

  if (req.query.parent && /^[0-9]+$/.test(req.query.parent)) {
    const parentTaskId = saferParseInt(req.query.parent);
    const parentTaskFromDb = await Task.findOne(parentTaskId);
    if (parentTaskFromDb) {
      parentTask = parentTaskFromDb;
    }
  }

  const fieldErrors = new Map<string, string[]>();
  if (req.method === "POST") {
    // Assuming new task here; should look at url params to see if there is
    // already a task id
    if (typeof req.body.title === "string") {
      t.title = req.body.title;
    } else {
      appendToMapList(fieldErrors, "title", "Not a string");
    }
    if (req.body.title === "") {
      appendToMapList(fieldErrors, "title", "Cannot be blank");
    }

    if (req.body.hasOwnProperty("status")) {
      if (typeof req.body.status === "string") {
        if (includes(" x-!", req.body.status)) {
          t.status = req.body.status;
        } else {
          appendToMapList(fieldErrors, "status", "Unsupported status");
        }
      } else {
        appendToMapList(fieldErrors, "status", "Not a string");
      }
    }

    if (req.body.hasOwnProperty("description")) {
      if (typeof req.body.description === "string") {
        t.description = req.body.description;
      } else {
        appendToMapList(fieldErrors, "status", "Not a string");
      }
    }

    if (req.body.hasOwnProperty("estimate")) {
      if (typeof req.body.estimate === "string") {
        const inputString = req.body.estimate.trim();
        if (inputString) {
          try {
            t.estimatedMinutes = new Duration(req.body.estimate).totalMinutes();
          } catch (e) {
            appendToMapList(
              fieldErrors,
              "estimate",
              e.constructor.name + ": " + e.message
            );
          }
        } else {
          t.estimatedMinutes = null;
        }
      } else {
        appendToMapList(fieldErrors, "estimate", "Not a string");
      }
    }

    if (fieldErrors.size > 0) {
      console.log("field errors", fieldErrors);
    }

    if (fieldErrors.size === 0) {
      const hadId = t.hasId();
      await t.save();
      if (!hadId) {
        const tl = new TaskLink();
        tl.parentTaskId = parentTask.id;
        tl.childTaskId = t.id;
        tl.priority = 1;
        await tl.save();
      }
      res.redirect(`/tasks/${t.id}`);
      return;
    }
  }

  // This doesn’t have to be tsx, the view should probably take a form object
  // instead
  res.send(
    fullHtmlDocumentWithBody(
      <TaskNav url={req.url}>
        <TaskCreate
          parentTask={parentTask}
          task={t}
          fieldErrors={fieldErrors}
        />
      </TaskNav>,
      undefined,
      [],
      ["/style.css"]
    )
  );
}
