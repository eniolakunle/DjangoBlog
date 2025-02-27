/**
 * @jest-environment jsdom
 */

const { intersectingObserver, linkHandler } = require("../js/scripts");

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
