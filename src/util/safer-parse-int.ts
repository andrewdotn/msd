import { i } from "../i";

export function saferParseInt(s?: string | number): number {
  if (typeof s === "number") {
    s = (s as number).toString();
  }
  if (typeof s !== "string") {
    throw new Error(`Given ${typeof s}, but expected string`);
  }
  if (!/^-?[0-9]+$/.test(s)) throw new Error(i`${s} is not an integer`);
  const ret = Number(s);
  if (ret.toString() !== s) {
    throw new Error(`${s} is ambiguous or not a JS-representable integer`);
  }
  return ret;
}

export function parseIntMaybe(s?: string): [true, number] | [false, undefined] {
  try {
    return [true, saferParseInt(s)];
  } catch {
    return [false, undefined];
  }
}

export function saferParseFloat(s: string): number {
  if (typeof s === "number") {
    s = (s as number).toString();
  }
  if (typeof s !== "string") {
    throw new Error(`Given ${typeof s}, but expected string`);
  }
  if (!/^-?[0-9]+(.[0-9]+)?$/.test(s))
    throw new Error(i`${s} is not a typical float`);
  const ret = Number(s);
  if (ret.toString() !== s) {
    throw new Error(`${s} is ambiguous or not a JS-representable float`);
  }
  return ret;
}
