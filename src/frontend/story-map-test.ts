import { addBreakpoints } from "./story-map";
import { expect } from "chai";
import { i } from "../i";

describe("addBreakpoints", function () {
  for (const [input, expected] of [
    ["foo", "foo"],
    ["foo/bar", "foo/\u200bbar"],
  ] as const) {
    it(i`returns ${expected} for ${input}`, function () {
      expect(addBreakpoints(input)).to.eql(expected);
    });
  }
});
