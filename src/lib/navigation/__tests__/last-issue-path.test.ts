import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  getRememberedIssuePath,
  getRememberedIssuePathForCurrentPost,
  rememberCurrentIssuePath,
} from "../last-issue-path";

describe("last issue path navigation memory", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.pushState(null, "", "/2026/april");
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.history.pushState(null, "", "/");
  });

  it("remembers the issue page used to open a post", () => {
    rememberCurrentIssuePath("post-1");

    expect(getRememberedIssuePath("post-1")).toBe("/2026/april");
  });

  it("finds the remembered issue page from the current post route", () => {
    rememberCurrentIssuePath("post-1");
    window.history.pushState(null, "", "/posts/post-1");

    expect(getRememberedIssuePathForCurrentPost()).toBe("/2026/april");
  });

  it("does not reuse an issue page for a different post", () => {
    rememberCurrentIssuePath("post-1");
    window.history.pushState(null, "", "/posts/post-2");

    expect(getRememberedIssuePathForCurrentPost()).toBeNull();
  });

  it("does not remember post pages as issue pages", () => {
    window.history.pushState(null, "", "/posts/post-1");

    rememberCurrentIssuePath("post-2");

    expect(getRememberedIssuePath("post-2")).toBeNull();
  });
});
