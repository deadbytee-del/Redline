(function () {
"use strict";
const VAULT_PATH = "data/prompts.enc.json";
const ITERATIONS = 100000;
function b64ToBytes(b64) {
const bin = atob(b64);
const bytes = new Uint8Array(bin.length);
for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
return bytes;
}
async function deriveKey(passphrase, saltBytes) {
const enc = new TextEncoder();
const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
return crypto.subtle.deriveKey(
{ name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
baseKey,
{ name: "AES-GCM", length: 256 },
false,
["decrypt"]
);
}
async function decryptEntry(entry, passphrase) {
const salt = b64ToBytes(entry.salt);
const iv = b64ToBytes(entry.iv);
const cipherBytes = b64ToBytes(entry.cipher);
const key = await deriveKey(passphrase, salt);
const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
const json = new TextDecoder().decode(plainBuf);
return JSON.parse(json);
}
function buildPanel() {
const aside = document.querySelector(".margin");
if (!aside) return null;
const section = document.createElement("section");
section.className = "margin__block";
section.id = "vaultBlock";
section.innerHTML =
'<h2 class="margin__label">Vault</h2>' +
'<p id="vaultStatus" style="color:var(--muted);font-size:12px;margin:0 0 8px;">Checking for encrypted entries…</p>' +
'<input id="vaultPassphrase" class="input" type="password" placeholder="Passphrase" autocomplete="off" hidden>' +
'<button id="vaultUnlockBtn" class="btn btn--ghost" type="button" style="margin-top:8px;width:100%;" hidden>Unlock vault</button>';
aside.appendChild(section);
return section;
}
function renderVaultEntries(entries) {
let list = document.getElementById("vaultList");
if (!list) {
list = document.createElement("div");
list.id = "vaultList";
list.className = "entry-list";
list.style.marginTop = "20px";
const ledger = document.querySelector(".ledger");
if (ledger) ledger.appendChild(list);
}
list.innerHTML = "";
entries.forEach((e, i) => {
const row = document.createElement("div");
row.className = "entry";
row.innerHTML =
'<div class="entry__num">V' + String(i + 1).padStart(2, "0") + '</div>' +
'<div class="entry__body">' +
'<div class="entry__title-row"><h3 class="entry__title"></h3></div>' +
'<p class="entry__preview"></p>' +
'<div class="entry__meta">' + (e.tags || []).map((t) => '<span class="entry__tag"></span>').join("") + '</div>' +
'</div>' +
'<div class="entry__actions"><button class="icon-btn" data-copy type="button">⧉</button></div>';
row.querySelector(".entry__title").textContent = e.title || "Untitled";
row.querySelector(".entry__preview").textContent = e.body || "";
const tagEls = row.querySelectorAll(".entry__tag");
(e.tags || []).forEach((t, idx) => { if (tagEls[idx]) tagEls[idx].textContent = t; });
row.querySelector("[data-copy]").addEventListener("click", () => {
navigator.clipboard.writeText(e.body || "").catch(() => {});
});
list.appendChild(row);
});
}
async function init() {
let manifest;
try {
const res = await fetch(VAULT_PATH, { cache: "no-store" });
if (!res.ok) throw new Error("not found");
manifest = await res.json();
} catch (err) {
return;
}
if (!manifest || !Array.isArray(manifest.entries) || manifest.entries.length === 0) return;
const section = buildPanel();
if (!section) return;
const status = section.querySelector("#vaultStatus");
const input = section.querySelector("#vaultPassphrase");
const btn = section.querySelector("#vaultUnlockBtn");
status.textContent = manifest.entries.length + " locked " + (manifest.entries.length === 1 ? "entry" : "entries");
input.hidden = false;
btn.hidden = false;
async function tryUnlock() {
const passphrase = input.value;
if (!passphrase) return;
btn.disabled = true;
btn.textContent = "Unlocking…";
try {
const decrypted = await Promise.all(manifest.entries.map((e) => decryptEntry(e, passphrase)));
renderVaultEntries(decrypted);
status.textContent = decrypted.length + " " + (decrypted.length === 1 ? "entry" : "entries") + " unlocked";
input.hidden = true;
btn.hidden = true;
} catch (err) {
status.textContent = "Wrong passphrase, or the file doesn't match.";
btn.disabled = false;
btn.textContent = "Unlock vault";
}
}
btn.addEventListener("click", tryUnlock);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
}
if (document.readyState === "loading") {
document.addEventListener("DOMContentLoaded", init);
} else {
init();
}
})();
