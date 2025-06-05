/**
 * @jest-environment jsdom
 */

// const { intersectingObserver, linkHandler } = require("../js/functions");
import {
  intersectingObserver,
  linkHandler,
  fadeTransition,
  endlessScrolling,
} from "../js/functions";

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

  // test("registers observers on blog cards and adds click listeners", () => {
  //   fadeTransition();

  //   // Ensure that intersectingObserver.observe was called for each blog card.
  //   const blogCards = document.querySelectorAll(".blog-card");
  //   expect(intersectingObserver.observe).toHaveBeenCalledTimes(
  //     blogCards.length
  //   );

  //   // Ensure linkHandler is called with the correct arguments.
  //   const overlay = document.querySelector(".transition-overlay");
  //   const links = document.querySelectorAll("a");
  //   links.forEach((link) => {
  //     expect(linkHandler).toHaveBeenCalledWith(link, overlay);
  //   });
  // });

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

// // Override IntersectionObserver so we can capture its instance and simulate intersection events.
// let mockObserverInstance;
// global.IntersectionObserver = class {
//   constructor(callback, options) {
//     this.callback = callback;
//     this.options = options;
//     this.observe = jest.fn();
//     this.unobserve = jest.fn();
//     mockObserverInstance = this;
//   }
//   disconnect() {}
// };

// describe("endlessScrolling", () => {
//   beforeEach(() => {
//     // Set up our DOM fixture.
//     document.body.innerHTML = `
//       <div id="sentinel"></div>
//       <a id="next-page-link" href="http://example.com/page1"></a>
//       <div id="bottom-grid"></div>
//       <div class="transition-overlay"></div>
//     `;

//     // Clear any previous mocks.
//     jest.clearAllMocks();
//   });

//   afterEach(() => {
//     // Clean up any mocked globals.
//     global.fetch && jest.restoreAllMocks();
//   });

//   test("loads new items and updates next-page-link when sentinel is intersecting", async () => {
//     // Dummy HTML to be returned by fetch:
//     // Contains one new item and a new next-page link with an updated URL.
//     const dummyHTML = `
//       <div class="item">
//         <div class="blog-card">
//           <a href="http://example.com/new" class="blog-card-link">New Item</a>
//         </div>
//       </div>
//       <div id="next-page-link" href="http://example.com/page2"></div>
//     `;
//     // Mock fetch to return dummyHTML.
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         text: () => Promise.resolve(dummyHTML),
//       })
//     );

//     // Call endlessScrolling to set up the observer.
//     endlessScrolling();

//     // Ensure that the sentinel was observed.
//     const sentinel = document.getElementById("sentinel");
//     expect(mockObserverInstance.observe).toHaveBeenCalledWith(sentinel);

//     // Simulate an intersection event on the sentinel.
//     const fakeEntry = [{ isIntersecting: true, target: sentinel }];
//     await mockObserverInstance.callback(fakeEntry);

//     // Wait for fetch to resolve and loadMore to finish.
//     // Use a microtask flush: returning the fetch promise will work since our test is async.
//     await Promise.resolve();

//     // Check that fetch was called with the correct URL and header.
//     expect(global.fetch).toHaveBeenCalledWith("http://example.com/page1", {
//       headers: { "X-Requested-With": "XMLHttpRequest" },
//     });

//     // Check that a new item was appended to #bottom-grid.
//     const container = document.getElementById("bottom-grid");
//     const newItems = container.querySelectorAll(".item");
//     expect(newItems.length).toBe(1);
//     // And check that the new next-page link's URL was updated.
//     const nextPageLink = document.getElementById("next-page-link");
//     expect(nextPageLink.getAttribute("href")).toBe("http://example.com/page2");
//   });

//   test("removes next-page-link and unobserves sentinel when no new next-page-link is found", async () => {
//     // Dummy HTML that does NOT include a new next-page link.
//     const dummyHTML = `
//       <div class="item">
//         <div class="blog-card">
//           <a href="http://example.com/new" class="blog-card-link">New Item</a>
//         </div>
//       </div>
//     `;
//     global.fetch = jest.fn(() =>
//       Promise.resolve({
//         text: () => Promise.resolve(dummyHTML),
//       })
//     );

//     endlessScrolling();

//     const sentinel = document.getElementById("sentinel");
//     expect(mockObserverInstance.observe).toHaveBeenCalledWith(sentinel);

//     // Simulate an intersection event.
//     const fakeEntry = [{ isIntersecting: true, target: sentinel }];
//     await mockObserverInstance.callback(fakeEntry);

//     // Wait for the fetch promise resolution.
//     await Promise.resolve();

//     // In this scenario, since dummyHTML lacks a new next-page link,
//     // the existing next-page-link should be removed from the DOM.
//     const nextPageLink = document.getElementById("next-page-link");
//     expect(nextPageLink).toBeNull();

//     // And observer.unobserve should have been called with the sentinel.
//     expect(mockObserverInstance.unobserve).toHaveBeenCalledWith(sentinel);
//   });
// });
