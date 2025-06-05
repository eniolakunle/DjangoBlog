"use strict";
// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectingObserver = void 0;
exports.linkHandler = linkHandler;
exports.fadeTransition = fadeTransition;
exports.endlessScrolling = endlessScrolling;
exports.intersectingObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add("intersecting-card");
        }
        else {
            entry.target.classList.remove("intersecting-card"); // Optional: Remove when out of view
        }
    });
}, { threshold: 0.7 }); // Trigger when 70% of the element is visible
function linkHandler(link, overlay) {
    var transitionLink = function (e) {
        if (link.hostname === window.location.hostname &&
            link.href !== window.location.href) {
            e.preventDefault(); // Prevent default action (navigation)
            var blogCard = link;
            while (blogCard) {
                if (blogCard.classList.contains("blog-card")) {
                    blogCard.classList.add("link-container");
                    break;
                }
                blogCard = blogCard.parentElement;
            }
            // Show the overlay and trigger fade-out effect
            overlay.classList.add("transition-active");
            setTimeout(function () {
                window.location.href = link.href; // Navigate after fade-out
            }, 200); // Duration matches transition time
        }
    };
    return transitionLink;
}
function fadeTransition() {
    var links = document.querySelectorAll("a");
    var overlay = document.querySelector(".transition-overlay");
    // on page load, give all cards ability to float when intersected
    document
        .querySelectorAll(".blog-card")
        .forEach(function (el) { return exports.intersectingObserver.observe(el); });
    links.forEach(function (link) {
        link.addEventListener("click", linkHandler(link, overlay));
    });
    // After the page loads, fade in the content
    window.addEventListener("load", function () {
        document.body.classList.add("fade-in");
        setTimeout(function () {
            overlay.classList.remove("transition-active"); // Hide overlay after fade-in
        }, 300); // Fade-in duration
    });
    // **Fix Back Button Issue: Ensure Page Always Fades Back In**
    window.addEventListener("pageshow", function (event) {
        if (event.persisted ||
            performance.getEntriesByType("navigation")[0].type === "back_forward") {
            overlay.classList.remove("transition-active"); // Hide overlay after fade-in
            Array.from(document.getElementsByClassName("link-container")).forEach(function (el) {
                el.classList.remove("link-container");
                // Remove link-container class when back button is used.
                // fixes bug where cards cover mobile nav bar
            });
        }
    });
}
function endlessScrolling() {
    var sentinel = document.getElementById("sentinel");
    if (!sentinel)
        return;
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                loadMore();
            }
        });
    });
    observer.observe(sentinel);
    var loading = false;
    function loadMore() {
        if (loading)
            return;
        var nextPageLink = document.getElementById("next-page-link");
        if (!nextPageLink) {
            observer.unobserve(sentinel); // No more pages to load
            return;
        }
        loading = true;
        var url = nextPageLink.getAttribute("href");
        fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } })
            .then(function (response) { return response.text(); })
            .then(function (html) {
            // Create a temporary element to hold the new HTML
            var tempDiv = document.createElement("div");
            tempDiv.innerHTML = html;
            // Append new items from the response to the container
            var newItems = tempDiv.querySelectorAll(".item");
            var container = document.getElementById("bottom-grid");
            var overlay = document.querySelector(".transition-overlay");
            // give newly loaded articles ability to float when intersected
            tempDiv
                .querySelectorAll(".blog-card")
                .forEach(function (el) { return exports.intersectingObserver.observe(el); });
            newItems.forEach(function (item) {
                var link = item.querySelector(".blog-card-link");
                // ensure new articles added will transition smoothly if clicked
                link.addEventListener("click", linkHandler(link, overlay));
                // remove class additions from new articles, they belong in bottom grid only
                if (item.classList.contains("main-article")) {
                    item.classList.remove("main-article");
                }
                container.appendChild(item);
            });
            // Update the next-page link (if any)
            var newNextPageLink = tempDiv.querySelector("#next-page-link");
            if (newNextPageLink) {
                nextPageLink.setAttribute("href", newNextPageLink.getAttribute("href"));
            }
            else {
                // No next page; remove the link and unobserve the sentinel
                nextPageLink.remove();
                observer.unobserve(sentinel);
            }
            loading = false;
        })
            .catch(function (error) {
            console.error("Error loading more items:", error);
            loading = false;
        });
    }
}
