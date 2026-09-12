(function () {
"use strict";
window.RedlineGuard = window.RedlineGuard || {};
const style = document.createElement("style");
style.textContent = `
#entryList { user-select: none; }
#entryList .entry__title,
#entryList .entry__preview { user-select: text; }
`;
document.head.appendChild(style);
let reads = 0;
let windowStart = Date.now();
const READ_LIMIT = 20; // full-list touches
const WINDOW_MS = 2000;
function noteRead() {
const now = Date.now();
if (now - windowStart > WINDOW_MS) {
windowStart = now;
reads = 0;
}
reads++;
if (reads > READ_LIMIT) {
applyCooldown();
}
}
function applyCooldown() {
const list = document.getElementById("entryList");
if (!list || list.dataset.cooldown === "1") return;
list.dataset.cooldown = "1";
list.style.filter = "blur(6px)";
list.style.pointerEvents = "none";
setTimeout(() => {
list.style.filter = "";
list.style.pointerEvents = "";
list.dataset.cooldown = "0";
reads = 0;
}, 1500);
}
const target = document.getElementById("entryList");
if (target && "MutationObserver" in window) {
const observer = new MutationObserver(() => noteRead());
observer.observe(target, { childList: true, subtree: true });
}
window.RedlineGuard.reportManualRead = noteRead;
})();
