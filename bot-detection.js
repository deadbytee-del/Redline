(function () {
"use strict";
window.RedlineGuard = window.RedlineGuard || {};
let score = 0;
const signals = [];
function flag(name, points) {
score += points;
signals.push(name);
}
if (navigator.webdriver) flag("webdriver-flag", 5);
if (navigator.plugins && navigator.plugins.length === 0) flag("no-plugins", 1);
if (!navigator.languages || navigator.languages.length === 0) flag("no-languages", 1);
let sawInput = false;
const markInput = () => { sawInput = true; cleanup(); };
function cleanup() {
window.removeEventListener("mousemove", markInput);
window.removeEventListener("keydown", markInput);
window.removeEventListener("touchstart", markInput);
}
window.addEventListener("mousemove", markInput, { once: true, passive: true });
window.addEventListener("keydown", markInput, { once: true });
window.addEventListener("touchstart", markInput, { once: true, passive: true });
setTimeout(() => {
if (!sawInput) {
flag("no-input-detected", 2);
finalize();
}
}, 4000);
if (!window.screen || window.screen.width === 0 || window.screen.height === 0) {
flag("implausible-screen", 2);
}
function finalize() {
window.RedlineGuard.botScore = score;
window.RedlineGuard.isSuspicious = score >= 4;
window.RedlineGuard.signals = signals.slice();
window.dispatchEvent(new CustomEvent("redline:bot-score", { detail: { score, signals } }));
}
finalize();
})();
