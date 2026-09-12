/**
 * @jest-environment jsdom
 */

// Mock the entitydb module before importing functions so that functions imports the mock
jest.mock("../js/entitydb", () => ({
  queryTitles: jest.fn(),
  indexTitles: jest.fn(),
}));

import {
  getCachedCandidates,
  resetCachedCandidates,
} from "../js/functions";

import { queryTitles } from "../js/entitydb";

// Polyfill TextDecoder for Node/Jest environment if missing
if (typeof TextDecoder === "undefined") {
  // eslint-disable-next-line global-require
  global.TextDecoder = require("util").TextDecoder;
}

describe("getCachedCandidates and cache behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ensure cache reset
    resetCachedCandidates();
  });

  test("returns DB candidates on first call and caches them", async () => {
    (queryTitles).mockResolvedValue(["/a", "/b"]);

    const articleUrls = ["/a", "/b", "/c"];

    const res1 = await getCachedCandidates("prompt1", articleUrls, 10);
    expect(res1).toEqual(["/a", "/b"]);
    // queryTitles should have been called once
    expect(queryTitles).toHaveBeenCalledTimes(1);

    // call again - should reuse cache and not call queryTitles
    const res2 = await getCachedCandidates("prompt1", articleUrls, 10);
    expect(res2).toEqual(["/a", "/b"]);
    expect(queryTitles).toHaveBeenCalledTimes(1);
  });

  test("falls back to articleUrls when DB returns empty and caches fallback", async () => {
    (queryTitles).mockResolvedValue([]);
    const articleUrls = ["/1", "/2"];

    const res = await getCachedCandidates("p", articleUrls, 10);
    expect(res).toEqual(articleUrls);
    expect(queryTitles).toHaveBeenCalledTimes(1);

    // subsequent call reuses cached fallback
    const res2 = await getCachedCandidates("p2", articleUrls, 10);
    expect(res2).toEqual(articleUrls);
    expect(queryTitles).toHaveBeenCalledTimes(1);
  });

  test("resetCachedCandidates clears cache so next call queries again", async () => {
    (queryTitles).mockResolvedValueOnce(["/x"]).mockResolvedValueOnce(["/y"]);
    const articleUrls = ["/x", "/y"];

    const r1 = await getCachedCandidates("one", articleUrls, 10);
    expect(r1).toEqual(["/x"]);
    expect(queryTitles).toHaveBeenCalledTimes(1);

    resetCachedCandidates();

    const r2 = await getCachedCandidates("two", articleUrls, 10);
    expect(r2).toEqual(["/y"]);
    expect(queryTitles).toHaveBeenCalledTimes(2);
  });
});
