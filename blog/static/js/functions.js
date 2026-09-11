// float blog cards when they are intersecting with the viewport,
// works well on mobile where hover is iffy and works on desktop well too
import { queryTitles } from "./entitydb.js";
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
const model = "gemini-3.5-flash-lite";
const url = `https://ai.google.dev/gemini-api/docs/models/${model}`;
const vectorDB = "EntityDB";
const vectorURL = "https://entity-db-landing.vercel.app";
// Export simple identifiers for UI/tests
export const MODEL = model;
export const VECTOR_DB = vectorDB;
// Minimal Powered By badge helpers (kept intentionally small for tests)
export function renderPoweredByBadge() {
    const el = document.createElement("div");
    el.className = "powered-by-badge";
    const modelLink = `<a href="${url}" target="_blank" rel="noopener">${MODEL}</a>`;
    const dbLink = `<a href="${vectorURL}" target="_blank" rel="noopener">${VECTOR_DB}</a>`;
    el.innerHTML = `Powered by ${modelLink} & ${dbLink}`;
    return el;
}
export function removePoweredByBadge() {
    const el = document.querySelector(".powered-by-badge");
    if (el && el.parentElement)
        el.parentElement.removeChild(el);
}
// Ensure the badge is appended into the search dialog (non-invasive).
function ensurePoweredByBadgeInDialog() {
    // prefer explicit dialog element; fall back to gemini-question container
    const dialog = document.querySelector(".search-dialog") ||
        document.getElementById("gemini-question") ||
        null;
    if (!dialog)
        return;
    // If badge already present inside dialog, nothing to do
    if (dialog.querySelector(".powered-by-badge"))
        return;
    // If the dialog is statically positioned, make it relative inline so
    // the absolute-positioned badge will be positioned relative to it.
    const computed = window.getComputedStyle(dialog).position;
    if (!computed || computed === "static") {
        dialog.style.position = "relative";
    }
    const badge = renderPoweredByBadge();
    dialog.appendChild(badge);
}
// Cache for the current search session: candidates only (one-time DB call)
let cachedCandidates = null;
// Clear cached candidates (useful to force a fresh DB query)
export function resetCachedCandidates() {
    cachedCandidates = null;
}
// Get cached candidates (one DB call). Returns the cached URLs if present,
// otherwise queries EntityDB once for `topK` results and caches the URLs.
export async function getCachedCandidates(prompt, articleUrls, topK = 10) {
    if (cachedCandidates) {
        console.log("EntityDB: reusing cached candidates ->", cachedCandidates);
        return cachedCandidates;
    }
    try {
        const candidates = await queryTitles(prompt, topK);
        if (candidates && candidates.length > 0) {
            cachedCandidates = candidates;
            console.log("EntityDB: cached top-" + topK + " candidates ->", candidates);
            return cachedCandidates;
        }
        // No candidates found; cache fallback to full articles list
        cachedCandidates = articleUrls.slice();
        console.log("EntityDB: no candidates found; using full article list");
        return cachedCandidates;
    }
    catch (e) {
        console.warn("EntityDB: error during initial query", e);
        cachedCandidates = articleUrls.slice();
        return cachedCandidates;
    }
}
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
export function parseUrls(urls) {
    try {
        const trimmed = (urls || "").trim();
        if (trimmed.startsWith("[")) {
            return JSON.parse(trimmed);
        }
        return trimmed
            .split(/,|\n/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
    catch (e) {
        return (urls || "")
            .split(/,|\n/)
            .map((s) => s.trim())
            .filter(Boolean);
    }
}
// Helper: normalize url for comparison (strip trailing slash)
function normalizeUrl(u) {
    return u.replace(/\/$/, "");
}
// Top-level helper: decode a Uint8Array chunk to string
function decodeChunk(value) {
    const decoder = new TextDecoder();
    return decoder.decode(value);
}
// Top-level helper: extract candidate text from a single SSE line (returns null if none)
function extractTextFromSseLine(line) {
    if (!line.startsWith("data: "))
        return null;
    try {
        const jsonData = JSON.parse(line.slice(6));
        return jsonData.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
    catch (e) {
        return null;
    }
}
// Top-level helper: check accumulatedText for FINAL_LINK and return whether the found url
// is in the provided set. This function only performs the check and returns a boolean.
export function checkForFinalLink(accumulated, normalizedSet) {
    const finalMatch = accumulated.match(/\s*(https?:\/\/[^^\s]+)/i);
    if (finalMatch && finalMatch[1]) {
        const foundUrl = normalizeUrl(finalMatch[1]);
        return [normalizedSet.has(foundUrl), foundUrl];
    }
    return [false, ""];
}
// Top-level helper: perform the UI cleanup, cancel the reader and redirect to the
// FINAL_LINK. This function assumes the link is present and in the set (caller should
// check with `checkForFinalLink` first). It mirrors the previous behavior exactly.
export async function redirectToFinalLink(geminiQuestion, foundUrl, reader) {
    geminiQuestion.textContent = "Here's an article just for you. Enjoy!";
    if (reader)
        await reader.cancel();
    setTimeout(() => {
        window.location.href = foundUrl;
    }, 300);
}
// Helper: build compact title->url lines for model prompt
export function buildListForModel(articleUrls) {
    return articleUrls
        .map((u) => {
        try {
            const tidy = normalizeUrl(u);
            const parts = tidy.split("/");
            const slug = parts[parts.length - 1] || tidy;
            const title = slug.replace(/-/g, " ");
            return `${title} -> ${tidy}`;
        }
        catch (e) {
            return u;
        }
    })
        .join("\n");
}
// Helper: build the model prompt with strict instructions
function buildFullPrompt(listForModel) {
    const instructions = `You are a concise article selector. Based only on the user's prompt and the list below, choose the single best article. If the user's response doesn't give a clear understanding of what they are looking for, ask a follow-up question. Each follow up question should only be one sentence that is fairly short, but concise, susinct, and effective. If you find an an article that fits the user's request return an answer immediately, otherwise ask at most 3 follow up questions to understand the user's intent better and return a final answer. The final answer MUST be a single line starting with EXACTLY: FINAL_LINK: <url> and the <url> must be one of the provided URLs below. Do not include any other text.`;
    return `${instructions}\nAvailable articles (title -> url):\n${listForModel}`;
}
function checkResponse(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Response body is null");
    }
    return reader;
}
// Helper: process streaming response from Gemini, detect FINAL_LINK and redirect
export async function postAndStream(sysPrompt, articleUrls, geminiQuestion, 
// optional cleanup callback to remove a loading UI created by caller
loaderCleanup) {
    const headers = {
        "Content-Type": "application/json",
    };
    const systemPrompt = getSystemInstruction(sysPrompt);
    const fetchBody = JSON.stringify({
        system_instruction: systemPrompt,
        contents: getConversation(),
    });
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse";
    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: fetchBody,
    });
    const reader = checkResponse(response);
    let accumulatedText = "";
    const normalizedSet = new Set(articleUrls.map(normalizeUrl));
    // Use top-level helpers
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        const chunk = decodeChunk(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
            const newText = extractTextFromSseLine(line);
            if (!newText)
                continue;
            accumulatedText += newText;
            // Split check and redirect responsibilities: first check, then redirect if needed.
            const [hasFinal, url] = checkForFinalLink(accumulatedText, normalizedSet);
            if (hasFinal) {
                loaderCleanup?.();
                await redirectToFinalLink(geminiQuestion, url, reader);
                return;
            }
        }
    }
    // Ensure loader removed if stream completes without final link
    loaderCleanup?.();
    addModelMessage(accumulatedText);
    geminiQuestion.textContent = accumulatedText;
    const searchInput = document.getElementById("search-input");
    searchInput.value = "";
}
// Refactored main: orchestrate helpers
export async function callGemini(prompt, urls) {
    const geminiQuestion = document.getElementById("gemini-question");
    if (!geminiQuestion)
        return;
    geminiQuestion.textContent = "";
    const articleUrls = parseUrls(urls);
    if (!articleUrls.length) {
        geminiQuestion.textContent = "No article URLs provided.";
        return;
    }
    // Feature flag: enable EntityDB narrowing (one-time query, top-10)
    const USE_ENTITYDB = true;
    let urlsToUse = articleUrls;
    // If EntityDB is enabled, obtain the cached candidates (one-time query)
    if (USE_ENTITYDB) {
        urlsToUse = await getCachedCandidates(prompt, articleUrls, 10);
    }
    const listForModel = buildListForModel(urlsToUse);
    const fullPrompt = buildFullPrompt(listForModel);
    try {
        // create a minimal loading UI (animated dots) inserted into geminiQuestion
        const cleanup = createGeminiLoader(geminiQuestion);
        // non-invasive: ensure Powered By badge is present inside the dialog
        try {
            ensurePoweredByBadgeInDialog();
        }
        catch (e) {
            /* ignore badge failures */
        }
        addUserMessage(prompt);
        await postAndStream(fullPrompt, urlsToUse, geminiQuestion, cleanup);
    }
    catch (error) {
        console.error("Error:", error);
        geminiQuestion.textContent =
            "Sorry, something went wrong. Please try again.";
    }
}
// In-memory conversation store (kept simple and small)
const conversationStore = [];
// Create a ConversationMessage object (pure, small function)
export function makeMessage(role, text) {
    return {
        role,
        parts: [{ text }],
    };
}
// Append a user message to the conversation and return it
export function addUserMessage(text) {
    const msg = makeMessage("user", text);
    conversationStore.push(msg);
    return msg;
}
// Append a model message to the conversation and return it
export function addModelMessage(text) {
    const msg = makeMessage("model", text);
    conversationStore.push(msg);
    return msg;
}
// Append a system instruction message to the conversation and return it
export function getSystemInstruction(text) {
    const msg = makeMessage("system_instruction", text);
    return msg;
}
// Return a shallow copy of the conversation (prevents accidental external mutation)
export function getConversation() {
    return conversationStore.slice();
}
// Clear the in-memory conversation (useful for tests or starting new dialogs)
export function clearConversation() {
    conversationStore.length = 0;
}
// Create a simple loader inside a parent element and return a cleanup function
export function createGeminiLoader(parent) {
    const br = document.createElement("br");
    const loader = document.createElement("span");
    loader.className = "gemini-loader";
    loader.textContent = "Thinking";
    parent.appendChild(br);
    parent.appendChild(loader);
    let dots = "";
    const iv = window.setInterval(() => {
        dots = dots.length < 3 ? dots + "." : "";
        loader.textContent = "Thinking" + dots;
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
// If the search dialog is added to the DOM later (e.g. shown via a click),
// ensure the Powered By badge is appended. Use a MutationObserver and also
// perform an immediate attempt. This is non-invasive and disconnects itself
// after the dialog is found.
if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
        // immediate attempt
        ensurePoweredByBadgeInDialog();
        const mo = new MutationObserver((mutations, obs) => {
            if (document.querySelector(".search-dialog")) {
                try {
                    ensurePoweredByBadgeInDialog();
                }
                catch (e) {
                    /* ignore */
                }
                obs.disconnect();
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }
    catch (e) {
        /* ignore environment where DOM isn't available */
    }
}
//# sourceMappingURL=functions.js.map