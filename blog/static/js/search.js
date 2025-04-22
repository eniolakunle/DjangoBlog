import { suggestTags } from "./functions.js";

// Usage
const tags = [
  "joy",
  "gratitude",
  "hope",
  "persevere",
  "faith",
  "win",
  "loss",
  "stress",
  "jesus",
];

function beginTensorFlowSearch() {
  var searchInput = document.getElementById("search-input").value;
  suggestTags(searchInput, tags).then(console.log);
}

const startSearch = document.getElementById("start-search-input");
startSearch.addEventListener("click", beginTensorFlowSearch);
