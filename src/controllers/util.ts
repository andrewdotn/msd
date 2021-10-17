import { Response } from "express";

export function badRequest(res: Response) {
  res.sendStatus(400);
}

export function isStringOrUndefined(
  requestValue: unknown
): requestValue is string | undefined {
  return requestValue === undefined || typeof requestValue === "string";
}
