// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too
import { intersectingObserver, linkHandler } from "./functions.js";

function fadeTransition() {
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

function endlessScrolling() {
  const sentinel = document.getElementById("sentinel");

  if (!sentinel) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadMore();
      }
    });
  });

  observer.observe(sentinel);

  let loading = false;

  function loadMore() {
    if (loading) return;

    const nextPageLink = document.getElementById("next-page-link");
    if (!nextPageLink) {
      observer.unobserve(sentinel); // No more pages to load
      return;
    }
    loading = true;
    const url = nextPageLink.getAttribute("href");

    fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
      .then((response) => response.text())
      .then((html) => {
        // Create a temporary element to hold the new HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        // Append new items from the response to the container
        const newItems = tempDiv.querySelectorAll(".item");
        const container = document.getElementById("bottom-grid");
        const overlay = document.querySelector(".transition-overlay");

        // give newly loaded articles ability to float when intersected
        tempDiv
          .querySelectorAll(".blog-card")
          .forEach((el) => intersectingObserver.observe(el));

        newItems.forEach((item) => {
          const link = item.querySelector(".blog-card-link");
          // ensure new articles added will transition smoothly if clicked
          link.addEventListener("click", linkHandler(link, overlay));

          // remove class additions from new articles, they belong in bottom grid only
          if (item.classList.contains("main-article")) {
            item.classList.remove("main-article");
          }
          container.appendChild(item);
        });

        // Update the next-page link (if any)
        const newNextPageLink = tempDiv.querySelector("#next-page-link");
        if (newNextPageLink) {
          nextPageLink.setAttribute(
            "href",
            newNextPageLink.getAttribute("href")
          );
        } else {
          // No next page; remove the link and unobserve the sentinel
          nextPageLink.remove();
          observer.unobserve(sentinel);
        }
        loading = false;
      })
      .catch((error) => {
        console.error("Error loading more items:", error);
        loading = false;
      });
  }
}

function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function formatTwitterButton() {
  const twitterButton = document.getElementById("twitter-share-button");
  if (twitterButton) {
    twitterButton.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default link behavior
      const tweetText = encodeURIComponent(
        "Wow, check this out, Jesus is Lord!"
      );
      const tweetUrl = encodeURIComponent(window.location.href);
      const hashtags = "jesus";
      const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}&hashtags=${hashtags}`;

      window.open(twitterUrl, "_blank");
    });
  }
}

function clearMenuOnClick(event) {
  var menu = document.getElementById("menu");
  var menuButton = document.getElementById("menu-button");
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
    menu.style.display = "none";
  }
}

let lastScrollY = window.scrollY;
const navbar = document.querySelector(".top-nav");

function clearMenuOnScroll() {
  var menu = document.getElementById("menu");
  if (menu.style.display !== "none") {
    menu.style.display = "none";
  }

  if (window.scrollY > 50 && window.scrollY > lastScrollY) {
    navbar.classList.add("hide");
  } else {
    navbar.classList.remove("hide");
  }
  lastScrollY = window.scrollY;
}

document.addEventListener("DOMContentLoaded", fadeTransition);
// endless scrolling is in below listener
document.addEventListener("DOMContentLoaded", endlessScrolling);

document.addEventListener("DOMContentLoaded", formatTwitterButton);

const menuButton = document.getElementById("menu-button");
if (menuButton) menuButton.addEventListener("click", toggleMenu);

document.addEventListener("click", clearMenuOnClick);

window.addEventListener("scroll", clearMenuOnScroll, { passive: true });

// module.exports = {
//   intersectingObserver,
//   linkHandler,
//   fadeTransition,
//   endlessScrolling,
//   toggleMenu,
//   formatTwitterButton,
//   clearMenuOnClick,
//   clearMenuOnScroll,
// };
