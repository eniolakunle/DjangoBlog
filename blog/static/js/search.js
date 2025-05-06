import { suggestTags } from "./functions.js";

// Usage
// const tags = [
//   "joy",
//   "gratitude",
//   "hope",
//   "persevere",
//   "faith",
//   "win",
//   "loss",
//   "stress",
//   "jesus",
// ];

const raw = document.getElementById("all-tags-data").innerText;
const match = raw.match(/\[([^\]]+)\]/);
let tags;
if (match) {
  const inner = match[1]; // e.g. '"need", "please", ...'
  tags = inner.match(/"([^"]+)"/g).map((s) => s.slice(1, -1));
  console.log(tags);
}

function beginTensorFlowSearch() {
  var searchInput = document.getElementById("search-input").value;
  suggestTags(searchInput, tags)
    .then((tags) => {
      fetch(`/blog/tag/${tags}/`, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      }).then((response) => {
        console.log(response);
        console.log(response.text());
        window.location.href = response.url;
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

const startSearch = document.getElementById("start-search-input");
startSearch.addEventListener("click", beginTensorFlowSearch);
