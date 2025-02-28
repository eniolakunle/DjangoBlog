/**
 * @jest-environment jsdom
 */

// const { intersectingObserver, linkHandler } = require("../js/functions");
import {
  intersectingObserver,
  linkHandler,
  fadeTransition,
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
