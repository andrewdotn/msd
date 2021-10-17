import { NextFunction, Request, Response } from "express";
import { saferParseInt } from "./util/safer-parse-int";
import { TaskManager } from "./task-manager";
import { Task } from "./models/task";
import { TaskNav } from "./views/task-nav";
import React from "react";
import { fullHtmlDocumentWithBody } from "./html";
import { storyMapView } from "./frontend/story-map";

export async function storyMap(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let t: Task;
  if (req.params.taskId !== undefined) {
    t = await Task.findOneOrFail({ id: saferParseInt(req.params.taskId) });
  } else {
    return next();
  }
  const children = await new TaskManager().loadFromDatabase(
    t.id,
    !!req.query.openOnly
  );

  res.send(
    fullHtmlDocumentWithBody(
      <TaskNav url={req.url}>{storyMapView(children)}</TaskNav>,
      `msd map for ${t.id}`,
      [],
      ["/style.css", "/story-map.css"]
    )
  );
}
