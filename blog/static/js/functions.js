// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too
// import * as tf from "@tensorflow/tfjs";
// import * as use from "@tensorflow-models/universal-sentence-encoder";

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

export function endlessScrolling() {
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

export async function suggestTags(userInput, tags) {
  const model = await use.load();
  const tagTensor = await model.embed(tags);
  const tagEmbeddings = await tagTensor.array();
  const embeddings = await model.embed([userInput]);
  const [inputTensor] = embeddings.arraySync();

  console.log(inputTensor);
  function cosine(a, b) {
    let d = 0,
      nA = 0,
      nB = 0;
    for (let i = 0; i < a.length; i++) {
      d += a[i] * b[i];
      nA += a[i] ** 2;
      nB += b[i] ** 2;
    }
    return d / (Math.sqrt(nA) * Math.sqrt(nB));
  }
  return tags
    .map((t, i) => ({ t, score: cosine(inputTensor, tagEmbeddings[i]) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map((x) => x.t)
    .join(",");
}
