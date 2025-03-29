import {
  intersectingObserver,
  linkHandler,
  fadeTransition,
  endlessScrolling,
} from "./functions.js";

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
