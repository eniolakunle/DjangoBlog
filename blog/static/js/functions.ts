// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too

export const intersectingObserver = new IntersectionObserver(
  (entries): void => {
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

export function linkHandler(link: HTMLAnchorElement, overlay: Element) {
  const transitionLink = (e: Event) => {
    if (
      link.hostname === window.location.hostname &&
      link.href !== window.location.href
    ) {
      e.preventDefault(); // Prevent default action (navigation)

      let blogCard: HTMLAnchorElement = link;
      while (blogCard) {
        if (blogCard.classList.contains("blog-card")) {
          blogCard.classList.add("link-container");
          break;
        }
        blogCard = blogCard.parentElement as HTMLAnchorElement;
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

export function fadeTransition(): void {
  const links: NodeListOf<HTMLAnchorElement> = document.querySelectorAll("a");
  const overlay: Element | null = document.querySelector(".transition-overlay");

  // on page load, give all cards ability to float when intersected
  document
    .querySelectorAll(".blog-card")
    .forEach((el) => intersectingObserver.observe(el));

  links.forEach((link) => {
    link.addEventListener("click", linkHandler(link, overlay as Element));
  });

  // After the page loads, fade in the content
  window.addEventListener("load", () => {
    document.body.classList.add("fade-in");
    setTimeout(() => {
      (overlay as Element).classList.remove("transition-active"); // Hide overlay after fade-in
    }, 300); // Fade-in duration
  });

  // **Fix Back Button Issue: Ensure Page Always Fades Back In**
  window.addEventListener("pageshow", function (event) {
    if (
      event.persisted ||
      (
        performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming
      )?.type === "back_forward"
    ) {
      (overlay as Element).classList.remove("transition-active"); // Hide overlay after fade-in

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

export function endlessScrolling(): void {
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
      observer.unobserve(sentinel as HTMLElement); // No more pages to load
      return;
    }
    loading = true;
    const url = nextPageLink.getAttribute("href");

    fetch(url as string, { headers: { "X-Requested-With": "XMLHttpRequest" } })
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
          (link as HTMLAnchorElement).addEventListener(
            "click",
            linkHandler(link as HTMLAnchorElement, overlay as Element)
          );

          // remove class additions from new articles, they belong in bottom grid only
          if (item.classList.contains("main-article")) {
            item.classList.remove("main-article");
          }
          (container as HTMLElement).appendChild(item);
        });

        // Update the next-page link (if any)
        const newNextPageLink = tempDiv.querySelector("#next-page-link");
        if (newNextPageLink) {
          nextPageLink.setAttribute(
            "href",
            (newNextPageLink as Element).getAttribute("href") as string
          );
        } else {
          // No next page; remove the link and unobserve the sentinel
          nextPageLink.remove();
          observer.unobserve(sentinel as HTMLElement);
        }
        loading = false;
      })
      .catch((error) => {
        console.error("Error loading more items:", error);
        loading = false;
      });
  }
}

export async function fetchXmlData(url: string): Promise<string> {
  const response = await fetch(url);
  const xmlText = await response.text();
  return xmlText;
}
export function parseXmlString(xmlString: string): Document {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  return xmlDoc;
}

export function extractLinks(xmlDoc: Document): (string | undefined)[] {
  const links = [];
  // Example for sitemap.xml: find all <loc> elements
  const locElements = xmlDoc.getElementsByTagName("loc");
  for (let i = 0; i < locElements.length; i++) {
    links.push(locElements[i]?.textContent);
  }

  // Example for RSS feeds: find all <link> elements within <item>
  const itemElements = xmlDoc.getElementsByTagName("item");
  for (let i = 0; i < itemElements.length; i++) {
    const linkElement = itemElements[i]?.getElementsByTagName("link")[0];
    if (linkElement) {
      links.push(linkElement.textContent);
    }
  }
  return links;
}


export async function searchLinks(): Promise<string | null> {
  const key = "eniolakunle_XML";
  const cacheExists = window.sessionStorage.getItem(key);
  if (!cacheExists) {
    console.log("No cache, fetching XML");
    const xmlText = await fetchXmlData(`${window.location.origin}/sitemap.xml`);
    const xmlDoc = parseXmlString(xmlText);
    const links = extractLinks(xmlDoc);
    window.sessionStorage.setItem(key, JSON.stringify(links));
  }

  return window.sessionStorage.getItem(key)
}
