// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too

export const intersectingObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("intersecting-card");
      } else {
        entry.target.classList.remove("intersecting-card"); // Optional: Remove when out of view
      }
    });
  },
  { threshold: 0.7 }
); // Trigger when 70% of the element is visible

export function linkHandler(link, overlay) {
  const transitionLink = (e) => {
    if (
      link.hostname === window.location.hostname &&
      link.href !== window.location.href
    ) {
      e.preventDefault(); // Prevent default action (navigation)

      let blogCard = link;
      while (blogCard) {
        if (blogCard.classList.contains("blog-card")) {
          blogCard.classList.add("link-container");
          break;
        }
        blogCard = blogCard.parentElement;
      }
      // Show the overlay and trigger fade-out effect
      overlay.classList.add("transition-active");

      setTimeout(() => {
        window.location.href = link.href; // Navigate after fade-out
      }, 200); // Duration matches transition time
    }
  };
  return transitionLink;
}

export function fadeTransition() {
  const links = document.querySelectorAll("a");
  const overlay = document.querySelector(".transition-overlay");

  // on page load, give all cards ability to float when intersected
  document
    .querySelectorAll(".blog-card")
    .forEach((el) => intersectingObserver.observe(el));

  links.forEach((link) => {
    link.addEventListener("click", linkHandler(link, overlay));
  });

  // After the page loads, fade in the content
  window.addEventListener("load", () => {
    document.body.classList.add("fade-in");
    setTimeout(() => {
      overlay.classList.remove("transition-active"); // Hide overlay after fade-in
    }, 300); // Fade-in duration
  });

  // **Fix Back Button Issue: Ensure Page Always Fades Back In**
  window.addEventListener("pageshow", function (event) {
    if (
      event.persisted ||
      performance.getEntriesByType("navigation")[0].type === "back_forward"
    ) {
      overlay.classList.remove("transition-active"); // Hide overlay after fade-in

      Array.from(document.getElementsByClassName("link-container")).forEach(
        (el) => {
          el.classList.remove("link-container");
          // Remove link-container class when back button is used.
          // fixes bug where cards cover mobile nav bar
        }
      );
    }
  });
}
