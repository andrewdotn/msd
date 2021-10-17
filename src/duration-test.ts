import { expect } from "chai";
import { Duration, DurationParseError } from "./duration";

describe("Duration", function () {
  for (const [input, expectedMinutes, error] of [
    [90, 90],
    ["30m", 30],
    ["30", 30],
    ["3", null, /multiple/],
    ["1h45m", 105],
    ["1h, 45m", 105],
    ["1h 45m", 105],
    ["2h", 120],
    ["", null, /empty/],
    ["2foo", null, /parse/],
    [-1, null, /negative/],
    ["-1", null, /Unable to parse/],
    [NaN, null, /integer/],
    [Infinity, null, /integer/],
    [3.7, null, /integer/],
    [0, null, /zero/],
  ] as [string | number, number | null, RegExp?][]) {
    let desc;
    if (error) {
      desc = `throws an error matching ${error} on input ${input}`;
    } else {
      desc = `parses ‘${input}’ as ${expectedMinutes} minutes`;
    }

    it(desc, function () {
      if (!error) {
        const d = new Duration(input);
        expect(d.totalMinutes()).to.eql(expectedMinutes);
      } else {
        expect(() => new Duration(input)).to.throw(DurationParseError, error);
      }
    });
  }

  for (const [minutes, expectedString] of [
    [90, "1h30m"],
    [5, "5m"],
    [120, "2h"],
    [75, "1h15m"],
  ]) {
    it(`stringifies ${minutes} as ‘${expectedString}’`, function () {
      expect(new Duration(minutes).toString()).to.eql(expectedString);
    });
  }
});
