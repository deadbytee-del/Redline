(function () {
"use strict";
window.RedlineGuard = window.RedlineGuard || {};
const WINDOW_MS = 3000;
const MAX_PER_WINDOW = {
copy: 6,
save: 4,
default: 8,
};
const log = new Map(); // action -> array of timestamps
function throttle(action) {
const now = Date.now();
const limit = MAX_PER_WINDOW[action] || MAX_PER_WINDOW.default;
const timestamps = (log.get(action) || []).filter((t) => now - t < WINDOW_MS);
if (timestamps.length >= limit) {
log.set(action, timestamps);
return false;
}
timestamps.push(now);
log.set(action, timestamps);
return true;
}
window.RedlineGuard.throttle = throttle;
document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("editorForm");
if (!form) return;
const honey = document.createElement("input");
honey.type = "text";
honey.name = "website";
honey.autocomplete = "off";
honey.tabIndex = -1;
honey.setAttribute("aria-hidden", "true");
Object.assign(honey.style, {
position: "absolute",
left: "-9999px",
width: "1px",
height: "1px",
opacity: "0",
});
form.appendChild(honey);
form.addEventListener("submit", (evt) => {
if (honey.value) {
evt.preventDefault();
evt.stopImmediatePropagation();
console.warn("[Redline] Blocked a submission that filled a honeypot field.");
}
}, true); // capture phase, runs before app.js's own submit handler
});
})();
