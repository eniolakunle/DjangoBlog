// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too
export const intersectingObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("intersecting-card");
        }
        else {
            entry.target.classList.remove("intersecting-card"); // Optional: Remove when out of view
        }
    });
}, { threshold: 0.7 }); // Trigger when 70% of the element is visible
export function linkHandler(link, overlay) {
    const transitionLink = (e) => {
        if (link.hostname === window.location.hostname &&
            link.href !== window.location.href) {
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
        if (event.persisted ||
            performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
            overlay.classList.remove("transition-active"); // Hide overlay after fade-in
            Array.from(document.getElementsByClassName("link-container")).forEach((el) => {
                el.classList.remove("link-container");
                // Remove link-container class when back button is used.
                // fixes bug where cards cover mobile nav bar
            });
        }
    });
}
export function endlessScrolling() {
    const sentinel = document.getElementById("sentinel");
    if (!sentinel)
        return;
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
        if (loading)
            return;
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
                nextPageLink.setAttribute("href", newNextPageLink.getAttribute("href"));
            }
            else {
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
export async function fetchXmlData(url) {
    const response = await fetch(url);
    const xmlText = await response.text();
    return xmlText;
}
export function parseXmlString(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    return xmlDoc;
}
export function extractLinks(xmlDoc) {
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
export async function searchLinks() {
    const key = "eniolakunle_XML";
    const cacheExists = window.sessionStorage.getItem(key);
    if (!cacheExists) {
        console.log("No cache, fetching XML");
        const xmlText = await fetchXmlData(`${window.location.origin}/sitemap.xml`);
        const xmlDoc = parseXmlString(xmlText);
        const links = extractLinks(xmlDoc);
        window.sessionStorage.setItem(key, JSON.stringify(links));
    }
    return window.sessionStorage.getItem(key);
}
// Helper: parse urls string into array
function parseUrls(urls) {
    try {
        const trimmed = (urls || '').trim();
        if (trimmed.startsWith('[')) {
            return JSON.parse(trimmed);
        }
        return trimmed
            .split(/,|\n/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
    catch (e) {
        return (urls || '')
            .split(/,|\n/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
}
// Helper: normalize url for comparison (strip trailing slash)
function normalizeUrl(u) {
    return u.replace(/\/$/, '');
}
// Helper: build compact title->url lines for model prompt
function buildListForModel(articleUrls) {
    return articleUrls
        .map((u) => {
        try {
            const tidy = normalizeUrl(u);
            const parts = tidy.split('/');
            const slug = parts[parts.length - 1] || tidy;
            const title = slug.replace(/-/g, ' ');
            return `${title} -> ${tidy}`;
        }
        catch (e) {
            return u;
        }
    })
        .join('\n');
}
// Helper: build the model prompt with strict instructions
function buildFullPrompt(prompt, listForModel) {
    const instructions = `You are a concise article selector. DO NOT ask any follow-up questions. Based only on the user's prompt and the list below, choose the single best article. The final answer MUST be a single line starting with EXACTLY: FINAL_LINK: <url> and the <url> must be one of the provided URLs below. Do not include any other text.`;
    return `${instructions}\nAvailable articles (title -> url):\n${listForModel}\nUser prompt: ${prompt}`;
}
// Helper: process streaming response from Gemini, detect FINAL_LINK and redirect
async function postAndStream(fullPrompt, articleUrls, geminiQuestion, 
// optional cleanup callback to remove a loading UI created by caller
loaderCleanup) {
    const headers = {
        "Content-Type": "application/json",
    };
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse";
    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: fullPrompt,
                        },
                    ],
                },
            ],
        }),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Response body is null');
    }
    const decoder = new TextDecoder();
    let accumulatedText = '';
    const normalizedSet = new Set(articleUrls.map(normalizeUrl));
    // Track whether we've removed the loading UI yet
    let firstChunkHandled = false;
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (!line.startsWith('data: '))
                continue;
            try {
                const jsonData = JSON.parse(line.slice(6));
                const newText = jsonData.candidates?.[0]?.content?.parts?.[0]?.text;
                if (newText) {
                    // On first non-empty chunk, remove the loading animation (if any)
                    if (!firstChunkHandled) {
                        try {
                            loaderCleanup?.();
                        }
                        catch (e) {
                            /* ignore cleanup errors */
                        }
                        firstChunkHandled = true;
                    }
                    accumulatedText += newText;
                    // geminiQuestion.textContent = accumulatedText;
                    const finalMatch = accumulatedText.match(/FINAL_LINK:\s*(https?:\/\/[^^\s]+)/i);
                    if (finalMatch && finalMatch[1]) {
                        const foundUrl = normalizeUrl(finalMatch[1]);
                        if (normalizedSet.has(foundUrl)) {
                            // Show a brief well-wish in the header, then redirect.
                            geminiQuestion.textContent = "Here's an article just for you. Enjoy!";
                            try {
                                await reader.cancel();
                            }
                            catch (e) {
                                /* ignore */
                            }
                            try {
                                loaderCleanup?.();
                            }
                            catch (e) {
                                /* ignore */
                            }
                            // Small delay so the user sees the message briefly before navigation
                            setTimeout(() => {
                                window.location.href = foundUrl;
                            }, 300);
                            return;
                        }
                    }
                }
            }
            catch (e) {
                // ignore parse errors for non-JSON SSE lines
            }
        }
    }
    // Ensure loader removed if stream completes without final link
    try {
        loaderCleanup?.();
    }
    catch (e) {
        /* ignore */
    }
}
// Refactored main: orchestrate helpers
export async function callGemini(prompt, urls) {
    const geminiQuestion = document.getElementById('gemini-question');
    if (!geminiQuestion)
        return;
    geminiQuestion.textContent = '';
    const articleUrls = parseUrls(urls);
    if (!articleUrls.length) {
        geminiQuestion.textContent = 'No article URLs provided.';
        return;
    }
    const listForModel = buildListForModel(articleUrls);
    const fullPrompt = buildFullPrompt(prompt, listForModel);
    try {
        // create a minimal loading UI (animated dots) inserted into geminiQuestion
        const cleanup = createGeminiLoader(geminiQuestion);
        await postAndStream(fullPrompt, articleUrls, geminiQuestion, cleanup);
    }
    catch (error) {
        console.error('Error:', error);
        geminiQuestion.textContent = 'Sorry, something went wrong. Please try again.';
    }
}
// Create a simple loader inside a parent element and return a cleanup function
function createGeminiLoader(parent) {
    const br = document.createElement('br');
    const loader = document.createElement('span');
    loader.className = 'gemini-loader';
    loader.textContent = 'Thinking';
    parent.appendChild(br);
    parent.appendChild(loader);
    let dots = '';
    const iv = window.setInterval(() => {
        dots = dots.length < 3 ? dots + '.' : '';
        loader.textContent = 'Thinking' + dots;
    }, 400);
    return () => {
        try {
            clearInterval(iv);
        }
        catch (e) {
            /* ignore */
        }
        try {
            if (br.parentElement)
                br.parentElement.removeChild(br);
        }
        catch (e) {
            /* ignore */
        }
        try {
            if (loader.parentElement)
                loader.parentElement.removeChild(loader);
        }
        catch (e) {
            /* ignore */
        }
    };
}
//# sourceMappingURL=functions.js.map