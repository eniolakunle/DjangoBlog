import {
  fadeTransition,
  endlessScrolling,
  searchLinks,
  callGemini
  //@ts-expect-error
} from "./functions.js?v=1.0.3";



function toggleMenu(): void {
  var menu = document.getElementById("menu");
  (menu as HTMLElement).style.display =
    (menu as HTMLElement).style.display === "flex" ? "none" : "flex";
}

function formatTwitterButton(): void {
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

function clearMenuOnClick(event: MouseEvent) {
  var menu = document.getElementById("menu");
  var menuButton = document.getElementById("menu-button");
  if (
    event.target instanceof Node &&
    !(menu as HTMLElement).contains(event.target) &&
    !(menuButton as HTMLElement).contains(event.target)
  ) {
    (menu as HTMLElement).style.display = "none";
  }
}

let lastScrollY = window.scrollY;
const navbar = document.querySelector(".top-nav");

function clearMenuOnScroll() {
  var menu = document.getElementById("menu");
  if ((menu as HTMLElement).style.display !== "none") {
    (menu as HTMLElement).style.display = "none";
  }

  if (window.scrollY > 50 && window.scrollY > lastScrollY) {
    (navbar as Element).classList.add("hide");
  } else {
    (navbar as Element).classList.remove("hide");
  }
  lastScrollY = window.scrollY;
}

function shareOnClick(): void {
  const shareButton = document.getElementById("share-button");

  if (navigator.share) {
    (shareButton as HTMLElement).style.display = "block"; // Show the button if Web Share API is supported

    (shareButton as HTMLElement).addEventListener("click", async () => {
      try {
        await navigator.share({
          title: document.title,
          text: "You came to mind immediately, I think you'll like this.",
          url: window.location.href,
        });
        console.log("Content shared successfully!");
      } catch (error) {
        console.error("Error sharing content:", error);
      }
    });
  } else {
    (shareButton as HTMLElement).style.display = "none"; // Hide the button if Web Share API is not supported
  }
}

// Search Dialog functionality
async function setupSearchDialog(): Promise<void> {
    const searchButton = document.getElementById('search-button');
    const searchDialog = document.getElementById('search-dialog') as HTMLDialogElement;
    const searchClose = document.getElementById('search-close');
    const searchEnter = document.getElementById('search-enter');
    // const searchForm = searchDialog?.querySelector('form');
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const geminiContext = await searchLinks();

    // Open dialog when search button is clicked
    searchButton?.addEventListener('click', () => {
        searchDialog?.showModal();
        searchInput?.focus();
    });

    // Close dialog when cancel button is clicked
    searchClose?.addEventListener('click', () => {
        searchDialog?.close();
    });

    // Handle form submission
    searchEnter?.addEventListener('click', (e) => {
        e.preventDefault();
        const searchQuery = searchInput?.value.trim();
        if (searchQuery) {
          callGemini(searchQuery, geminiContext as string)
            // window.location.href = `/search/?q=${encodeURIComponent(searchQuery)}`;
        }
        // searchDialog?.close();
    });

  // Prevent Enter from closing the dialog: intercept Enter and trigger the search button click
  searchDialog?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Allow Enter inside textareas
      const active = document.activeElement as HTMLElement | null;
      if (active && active.tagName.toLowerCase() === 'textarea') return;
      e.preventDefault();
      // Trigger the click handler for the search-enter button without closing the dialog
      searchEnter?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  });

    // Close dialog when clicking backdrop
    searchDialog?.addEventListener('click', (e: MouseEvent) => {
        if (e.target === searchDialog) {
            searchDialog?.close();
        }
    });
}

document.addEventListener('DOMContentLoaded', setupSearchDialog);

document.addEventListener("DOMContentLoaded", fadeTransition);
// endless scrolling is in below listener
document.addEventListener("DOMContentLoaded", endlessScrolling);

document.addEventListener("DOMContentLoaded", formatTwitterButton);

document.addEventListener("DOMContentLoaded", shareOnClick);

const menuButton = document.getElementById("menu-button");
if (menuButton) menuButton.addEventListener("click", toggleMenu);

document.addEventListener("click", clearMenuOnClick);

window.addEventListener("scroll", clearMenuOnScroll, { passive: true });
