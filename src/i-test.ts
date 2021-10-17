import { i } from "./i";
import { expect } from "chai";

describe("i", function () {
  it("works for plain text", function () {
    expect(i`hello world`).to.eql("hello world");
  });

  it("works for number", function () {
    expect(i`a ${0}`).to.eql("a 0");
  });

  it("works when an expression comes immediately at the start or end", function () {
    expect(i`${0} hi ${1}`).to.eql("0 hi 1");
  });

  it("quotes strings", function () {
    expect(i`a ${"a"}`).to.eql("a 'a'");
  });

  it("includes object values", function () {
    expect(i`a ${{ a: 1, b: 2 }}`).to.eql("a { a: 1, b: 2 }");
  });
});
