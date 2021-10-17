import XRegExp from "xregexp";
import { saferParseInt } from "./util/safer-parse-int";

/**
 * Matcher for strings like ‘1h20m’ or ‘20m’ or ‘3h’
 */
const re = XRegExp.tag("x")`
      ^
      \s*
      (?:(?<hours>   [0-9]+ )h\s*,?)?
      \s*
      (?:(?<minutes>   [0-9]+ )m?)?
      \s*
      $
    `;

export class DurationParseError extends Error {
  constructor(message: string, input?: string) {
    super(`${message} on ‘${input}’`);
    this.input = input;
  }

  readonly input?: string;
}

export class Duration {
  private _totalMinutes: number;
  private _input: string;

  constructor(inputString: string);
  constructor(minutes: number);
  constructor(input: string | number);
  constructor(param1: string | number) {
    this._input = new String(param1).toString();

    try {
      if (typeof param1 === "string") {
        this._totalMinutes = this._parse(param1);
      } else if (typeof param1 === "number") {
        this._totalMinutes = saferParseInt(param1);
      } else {
        this._throw(`Unsupported parameter type: ${typeof param1}`);
      }
      this._ensureValid();
    } catch (e) {
      if (!(e instanceof DurationParseError)) {
        throw new DurationParseError(e.message);
      }
      throw e;
    }
  }

  private _throw(msg: string): never {
    throw new DurationParseError(msg, this._input);
  }

  private _ensureValid() {
    if (this._totalMinutes === 0) {
      this._throw("Must be non-zero");
    }
    if (!(this._totalMinutes > 0)) {
      this._throw("Should not be negative");
    }
    if (this._totalMinutes % 5 != 0) {
      this._throw("minutes must be a multiple of 5");
    }
  }

  private _parse(inputString: string) {
    const match = XRegExp.exec(inputString, re);
    if (!match) {
      this._throw("Unable to parse");
    }

    let ret = 0;
    let seenSomething = false;
    if (match.groups?.hours !== undefined) {
      seenSomething = true;
      const hours = saferParseInt(match.groups.hours);
      ret += hours * 60;
    }
    if (match.groups?.minutes !== undefined) {
      seenSomething = true;
      const minutes = saferParseInt(match.groups.minutes);
      ret += minutes;
    }

    if (!seenSomething) {
      this._throw("empty input");
    }

    return ret;
  }

  totalMinutes() {
    return this._totalMinutes;
  }

  toString() {
    let ret = "";
    const minutes = this._totalMinutes % 60;
    if (minutes != 0) {
      ret = `${minutes}m`;
    }
    const hours = (this._totalMinutes - minutes) / 60;
    if (hours > 0) {
      ret = `${hours}h${ret}`;
    }
    return ret;
  }
}
