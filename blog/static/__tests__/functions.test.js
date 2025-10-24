/**
 * @jest-environment jsdom
 */

// const { intersectingObserver, linkHandler } = require("../js/functions");
import {
  intersectingObserver,
  linkHandler,
  fadeTransition,
  extractLinks,
  parseUrls,
  buildListForModel,
  searchLinks,
  postAndStream,
  callGemini,
  createGeminiLoader,
} from "../js/functions";

// Polyfill TextDecoder for Node/Jest environment if missing
if (typeof TextDecoder === "undefined") {
  // util.TextDecoder is available in Node
  // eslint-disable-next-line global-require
  global.TextDecoder = require("util").TextDecoder;
}

describe("IntersectionObserver functionality", () => {
  test("adds 'intersecting-card' class when element is intersecting", () => {
    const element = document.createElement("div");
    element.className = "blog-card";

    // Simulate an intersection event
    const fakeEntries = [{ isIntersecting: true, target: element }];
    intersectingObserver.callback(fakeEntries);

    expect(element.classList.contains("intersecting-card")).toBe(true);
  });

  test("removes 'intersecting-card' class when element is not intersecting", () => {
    const element = document.createElement("div");
    element.className = "blog-card intersecting-card";
    const fakeEntries = [{ isIntersecting: false, target: element }];
    intersectingObserver.callback(fakeEntries);

    expect(element.classList.contains("intersecting-card")).toBe(false);
  });
});

describe("linkHandler", () => {
  let link, overlay, blogCard;

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="blog-card">
        <a href="http://localhost.com" class="blog-card-link">Test Link</a>
      </div>
      <div class="transition-overlay"></div>
    `;
    blogCard = document.querySelector(".blog-card");
    link = document.querySelector(".blog-card-link");
    overlay = document.querySelector(".transition-overlay");

    // Set up window.location for testing
    delete window.location;
    window.location = {
      href: "http://localhost.com/blog",
      hostname: "localhost.com",
    };
  });

  test("prevents default navigation and adds classes", () => {
    const event = { preventDefault: jest.fn() };
    const handler = linkHandler(link, overlay);
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(blogCard.classList.contains("link-container")).toBe(true);
    expect(overlay.classList.contains("transition-active")).toBe(true);
  });
});

describe("fadeTransition", () => {
  beforeEach(() => {
    // Set up our DOM fixture.
    document.body.innerHTML = `
      <a href="http://example.com" class="blog-card-link">Test Link</a>
      <div class="transition-overlay transition-active"></div>
      <div class="blog-card">Card 1</div>
      <div class="blog-card">Card 2</div>
      <div class="link-container">Should be removed</div>
    `;
    // Clear any previous mocks.
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("adds fade-in class on window load and removes overlay's transition-active after 300ms", () => {
    jest.useFakeTimers();
    fadeTransition();

    // Dispatch the 'load' event.
    window.dispatchEvent(new Event("load"));

    // Immediately, body should have the 'fade-in' class.
    expect(document.body.classList.contains("fade-in")).toBe(true);

    // Fast-forward time by 300ms.
    jest.advanceTimersByTime(300);

    // The overlay should have had its 'transition-active' class removed.
    const overlay = document.querySelector(".transition-overlay");
    expect(overlay.classList.contains("transition-active")).toBe(false);
  });

  test("handles pageshow event to remove overlay's transition-active and clear link-container classes", () => {
    fadeTransition();

    // Add classes to simulate pre-existing conditions.
    const overlay = document.querySelector(".transition-overlay");
    overlay.classList.add("transition-active");

    // Simulate a link-container element that should be cleared.
    const dummyElement = document.createElement("div");
    dummyElement.classList.add("link-container");
    document.body.appendChild(dummyElement);

    // Stub performance.getEntriesByType to simulate back/forward navigation.
    global.performance.getEntriesByType = jest.fn(() => [
      { type: "back_forward" },
    ]);

    // Dispatch a pageshow event.
    const pageshowEvent = new Event("pageshow");
    // Manually add a persisted property.
    Object.defineProperty(pageshowEvent, "persisted", { value: true });
    window.dispatchEvent(pageshowEvent);

    // Overlay should no longer have 'transition-active'.
    expect(overlay.classList.contains("transition-active")).toBe(false);

    // All elements with class 'link-container' should have been cleared.
    const remainingLinkContainers =
      document.getElementsByClassName("link-container");
    expect(remainingLinkContainers.length).toBe(0);
  });
});

describe("helpers and integration", () => {
  test("extractLinks finds <loc> and <item><link>", () => {
    const parser = new DOMParser();
    // Keep XML minimal and without namespaces so getElementsByTagName works reliably
    const xml = `
      <urlset>
        <url><loc>https://eniolakunle.pythonanywhere.com/blog/2025/10/23/everything-youre-chasing-is-a-decision-away-what-will-it-take-to-have-it-all/</loc></url>
        <url><loc>https://eniolakunle.pythonanywhere.com/blog/2025/10/21/your-fortune-depends-on-one-moment/</loc></url>
      </urlset>
      <rss>
        <channel>
          <item><link>https://b.example/two</link></item>
        </channel>
      </rss>
    `;

    // Wrap with a single root element so DOMParser doesn't error
    const doc = parser.parseFromString(`<root>${xml}</root>`, "text/xml");
    const links = extractLinks(doc);
    expect(links).toEqual(
      expect.arrayContaining([
        "https://eniolakunle.pythonanywhere.com/blog/2025/10/23/everything-youre-chasing-is-a-decision-away-what-will-it-take-to-have-it-all/",
        "https://eniolakunle.pythonanywhere.com/blog/2025/10/21/your-fortune-depends-on-one-moment/",
      ])
    );
  });

  test("parseUrls handles JSON arrays, commas and newlines", () => {
    expect(parseUrls('["/a","/b"]')).toEqual(["/a", "/b"]);
    expect(parseUrls("/a, /b\n/c")).toEqual(["/a", "/b", "/c"]);
    expect(parseUrls("")).toEqual([]);
  });

  test("buildListForModel converts slugs to title -> url lines", () => {
    const urls = ["https://site/hello-world", "https://site/another-one/"];
    const out = buildListForModel(urls);
    expect(out).toContain("hello world -> https://site/hello-world");
    expect(out).toContain("another one -> https://site/another-one");
  });

  test("searchLinks fetches sitemap and caches result in sessionStorage", async () => {
    const fakeXml = "<urlset><url><loc>https://x/1</loc></url></urlset>";
    global.fetch = jest.fn(() =>
      Promise.resolve({ text: () => Promise.resolve(fakeXml) })
    );
    // clear sessionStorage
    window.sessionStorage.removeItem("eniolakunle_XML");
    // ensure origin
    delete window.location;
    window.location = { origin: "https://site" };
    const result = await searchLinks();
    const cached = window.sessionStorage.getItem("eniolakunle_XML");
    expect(cached).toBeDefined();
    expect(JSON.parse(cached)).toContain("https://x/1");
    expect(result).toEqual(window.sessionStorage.getItem("eniolakunle_XML"));
  });

  test("createGeminiLoader appends nodes and cleanup removes them", () => {
    const parent = document.createElement("div");
    const cleanup = createGeminiLoader(parent);
    expect(parent.querySelector(".gemini-loader")).toBeTruthy();
    // advance timers to simulate dots
    jest.useFakeTimers();
    jest.advanceTimersByTime(1200);
    cleanup();
    expect(parent.querySelector(".gemini-loader")).toBeNull();
    jest.useRealTimers();
  });

  test("postAndStream reads SSE chunks, calls loaderCleanup and redirects on FINAL_LINK", async () => {
    // Prepare a fake reader that yields one chunk containing FINAL_LINK and then done
    // Use Buffer to create a Uint8Array chunk compatible with TextDecoder
    const candidate = {
      candidates: [
        { content: { parts: [{ text: "FINAL_LINK: https://site/one" }] } },
      ],
    };
    const sseLine = "data: " + JSON.stringify(candidate) + "\n";
    const chunk = Buffer.from(sseLine);

    const reader = {
      read: jest
        .fn()
        .mockResolvedValueOnce({ done: false, value: chunk })
        .mockResolvedValueOnce({ done: true }),
      cancel: jest.fn().mockResolvedValue(undefined),
    };

    // mock fetch to return response with body.getReader
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, body: { getReader: () => reader } })
    );

    // spy on loader cleanup and window.location
    const parent = document.createElement("div");
    const geminiQuestion = document.createElement("div");
    document.body.appendChild(geminiQuestion);
    const cleanup = jest.fn();

    // mock normalize set by passing articleUrls that include the target
    const urls = ["https://site/one"];

    // stub window.location.href setter
    delete window.location;
    window.location = { href: "about:blank" };

    await postAndStream("prompt", urls, geminiQuestion, cleanup);

    // loader cleanup should have been called
    expect(cleanup).toHaveBeenCalled();
    // geminiQuestion text updated
    expect(geminiQuestion.textContent).toContain(
      "Here's an article just for you"
    );
    // ensure reader.cancel was attempted
    expect(reader.cancel).toHaveBeenCalled();
  });

  test("callGemini handles missing gemini-question element and empty urls", async () => {
    document.body.innerHTML = ""; // no gemini-question
    await expect(callGemini("q", "")).resolves.toBeUndefined();

    // now with gemini-question present but empty urls
    const g = document.createElement("div");
    g.id = "gemini-question";
    document.body.appendChild(g);
    await callGemini("q", "");
    expect(g.textContent).toBe("No article URLs provided.");
  });
});
