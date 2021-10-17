import { open, write } from "fs-extra";

let fd: number | undefined;
let pending: Promise<unknown> = Promise.resolve(null);

async function waitThenWrite(p: Promise<unknown>, msg: string) {
  await p;
  if (fd === undefined) {
    fd = await open("msd.log", "a");
  }
  if (!msg.endsWith("\n")) {
    msg += "\n";
  }
  await write(fd, msg);
}

export function logInfo(msg: string) {
  pending = waitThenWrite(pending, new Date().toISOString() + ": " + msg);
}
