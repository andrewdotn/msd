import express from "express";
import { Task } from "../models/task";
import { saferParseInt } from "../util/safer-parse-int";
import { TaskComment } from "../models/task-comment";

export async function commentOnTask(
  req: express.Request,
  res: express.Response
) {
  const task = await Task.findOneOrFail({
    id: saferParseInt(req.params.taskId),
  });
  if (typeof req.body.comment !== "string") {
    throw Error("comment is not a string");
  }
  const text = req.body.comment;
  const comment = TaskComment.create({ task, text });
  await comment.save();
  res.redirect(`/tasks/${task.id}`);
}
