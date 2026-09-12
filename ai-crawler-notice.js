(function () {
"use strict";
const KNOWN_AI_CRAWLERS = [
"GPTBot", "ChatGPT-User", "CCBot", "anthropic-ai", "ClaudeBot", "Claude-Web",
"Google-Extended", "Bytespider", "PerplexityBot", "Applebot-Extended",
"Amazonbot", "Diffbot", "Omgilibot", "FacebookBot", "cohere-ai",
];
function ensureMeta(name, content) {
let tag = document.querySelector(`meta[name="${name}"]`);
if (!tag) {
tag = document.createElement("meta");
tag.setAttribute("name", name);
document.head.appendChild(tag);
}
tag.setAttribute("content", content);
}
ensureMeta("robots", "noindex, nofollow");
ensureMeta("noai", "noai, noimageai");
const ua = navigator.userAgent || "";
const matched = KNOWN_AI_CRAWLERS.find((sig) => ua.includes(sig));
if (matched) {
console.info(`[Redline] Request identified itself as "${matched}". ` +
`Opt-out signals are in place; whether it honors them is up to that crawler.`);
}
})();
