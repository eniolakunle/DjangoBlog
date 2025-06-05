"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var functions_js_1 = require("./functions.js");
function toggleMenu() {
    var menu = document.getElementById("menu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}
function formatTwitterButton() {
    var twitterButton = document.getElementById("twitter-share-button");
    if (twitterButton) {
        twitterButton.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior
            var tweetText = encodeURIComponent("Wow, check this out, Jesus is Lord!");
            var tweetUrl = encodeURIComponent(window.location.href);
            var hashtags = "jesus";
            var twitterUrl = "https://twitter.com/intent/tweet?text=".concat(tweetText, "&url=").concat(tweetUrl, "&hashtags=").concat(hashtags);
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
var lastScrollY = window.scrollY;
var navbar = document.querySelector(".top-nav");
function clearMenuOnScroll() {
    var menu = document.getElementById("menu");
    if (menu.style.display !== "none") {
        menu.style.display = "none";
    }
    if (window.scrollY > 50 && window.scrollY > lastScrollY) {
        navbar.classList.add("hide");
    }
    else {
        navbar.classList.remove("hide");
    }
    lastScrollY = window.scrollY;
}
function shareOnClick() {
    var _this = this;
    var shareButton = document.getElementById("share-button");
    if (navigator.share) {
        shareButton.style.display = "block"; // Show the button if Web Share API is supported
        shareButton.addEventListener("click", function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, navigator.share({
                                title: document.title,
                                text: "You came to mind immediately, I think you'll like this.",
                                url: window.location.href,
                            })];
                    case 1:
                        _a.sent();
                        console.log("Content shared successfully!");
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Error sharing content:", error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    }
    else {
        shareButton.style.display = "none"; // Hide the button if Web Share API is not supported
    }
}
document.addEventListener("DOMContentLoaded", functions_js_1.fadeTransition);
// endless scrolling is in below listener
document.addEventListener("DOMContentLoaded", functions_js_1.endlessScrolling);
document.addEventListener("DOMContentLoaded", formatTwitterButton);
document.addEventListener("DOMContentLoaded", shareOnClick);
var menuButton = document.getElementById("menu-button");
if (menuButton)
    menuButton.addEventListener("click", toggleMenu);
document.addEventListener("click", clearMenuOnClick);
window.addEventListener("scroll", clearMenuOnScroll, { passive: true });
