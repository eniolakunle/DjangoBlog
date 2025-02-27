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
