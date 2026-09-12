(function () {
"use strict";
const el = (id) => document.getElementById(id);
const state = {
query: "",
activeTag: null,
sort: "updated-desc",
editingId: null,
};
const dom = {
entryList: el("entryList"),
emptyState: el("emptyState"),
stats: el("stats"),
resultCount: el("resultCount"),
tagList: el("tagList"),
searchInput: el("searchInput"),
sortSelect: el("sortSelect"),
overlay: el("overlay"),
editorPanel: el("editorPanel"),
editorForm: el("editorForm"),
editorTitle: el("editorTitle"),
fieldTitle: el("fieldTitle"),
fieldTags: el("fieldTags"),
fieldBody: el("fieldBody"),
fieldNotes: el("fieldNotes"),
fieldPinned: el("fieldPinned"),
deleteEntryBtn: el("deleteEntryBtn"),
toast: el("toast"),
};
function getFilteredSorted() {
let entries = RedlineStore.list();
if (state.activeTag) {
entries = entries.filter((e) => e.tags.includes(state.activeTag));
}
if (state.query.trim()) {
const q = state.query.trim().toLowerCase();
entries = entries.filter((e) =>
e.title.toLowerCase().includes(q) ||
e.body.toLowerCase().includes(q) ||
e.notes.toLowerCase().includes(q) ||
e.tags.some((t) => t.includes(q))
);
}
switch (state.sort) {
case "created-desc":
entries.sort((a, b) => b.createdAt - a.createdAt);
break;
case "title-asc":
entries.sort((a, b) => a.title.localeCompare(b.title));
break;
case "pinned-first":
entries.sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
break;
default:
entries.sort((a, b) => b.updatedAt - a.updatedAt);
}
if (state.sort !== "title-asc") {
entries.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
}
return entries;
}
function formatDate(ts) {
const d = new Date(ts);
return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function renderList() {
const entries = getFilteredSorted();
dom.entryList.innerHTML = "";
dom.resultCount.textContent = `${entries.length} shown`;
dom.stats.textContent = `${RedlineStore.list().length} ${RedlineStore.list().length === 1 ? "entry" : "entries"} on file`;
dom.emptyState.hidden = entries.length !== 0;
entries.forEach((entry, i) => {
const row = document.createElement("div");
row.className = "entry" + (entry.pinned ? " is-pinned" : "");
row.setAttribute("role", "listitem");
row.dataset.id = entry.id;
const num = String(i + 1).padStart(3, "0");
row.innerHTML = `
<div class="entry__num">${num}</div>
<div class="entry__body">
<div class="entry__title-row">
<h3 class="entry__title"></h3>
${entry.pinned ? '<span class="entry__pin">PINNED</span>' : ""}
</div>
<p class="entry__preview"></p>
<div class="entry__meta">
${entry.tags.map((t) => `<span class="entry__tag">${escapeHTML(t)}</span>`).join("")}
<span class="entry__date">edited ${formatDate(entry.updatedAt)}</span>
</div>
</div>
<div class="entry__actions">
<button class="icon-btn" data-action="copy" title="Copy prompt" type="button">⧉</button>
<button class="icon-btn" data-action="edit" title="Edit" type="button">✎</button>
</div>
`;
row.querySelector(".entry__title").textContent = entry.title;
row.querySelector(".entry__preview").textContent = entry.body;
row.addEventListener("click", (evt) => {
const actionBtn = evt.target.closest("[data-action]");
if (actionBtn) {
evt.stopPropagation();
if (actionBtn.dataset.action === "copy") copyPrompt(entry);
if (actionBtn.dataset.action === "edit") openEditor(entry.id);
return;
}
openEditor(entry.id);
});
dom.entryList.appendChild(row);
});
}
function renderTags() {
const tags = RedlineStore.allTags();
dom.tagList.innerHTML = "";
if (tags.length === 0) {
dom.tagList.innerHTML = '<li class="tag-list__empty">No tags yet</li>';
return;
}
const allLi = document.createElement("li");
const allBtn = document.createElement("button");
allBtn.className = "tag-chip" + (state.activeTag === null ? " is-active" : "");
allBtn.type = "button";
allBtn.textContent = "All entries";
allBtn.addEventListener("click", () => {
state.activeTag = null;
renderTags();
renderList();
});
allLi.appendChild(allBtn);
dom.tagList.appendChild(allLi);
tags.forEach(([tag, count]) => {
const li = document.createElement("li");
const btn = document.createElement("button");
btn.className = "tag-chip" + (state.activeTag === tag ? " is-active" : "");
btn.type = "button";
btn.innerHTML = `<span></span><span class="tag-chip__count">${count}</span>`;
btn.querySelector("span").textContent = tag;
btn.addEventListener("click", () => {
state.activeTag = state.activeTag === tag ? null : tag;
renderTags();
renderList();
});
li.appendChild(btn);
dom.tagList.appendChild(li);
});
}
function escapeHTML(str) {
const div = document.createElement("div");
div.textContent = str;
return div.innerHTML;
}
let toastTimer = null;
function showToast(msg) {
dom.toast.textContent = msg;
dom.toast.classList.add("is-visible");
clearTimeout(toastTimer);
toastTimer = setTimeout(() => dom.toast.classList.remove("is-visible"), 2200);
}
function copyPrompt(entry) {
if (window.RedlineGuard && !window.RedlineGuard.throttle("copy")) {
showToast("Slow down a moment.");
return;
}
navigator.clipboard.writeText(entry.body)
.then(() => showToast("Prompt copied."))
.catch(() => showToast("Couldn't copy — select the text manually."));
}
function openEditor(id) {
state.editingId = id || null;
const entry = id ? RedlineStore.get(id) : null;
dom.editorTitle.textContent = entry ? "Edit entry" : "New entry";
dom.fieldTitle.value = entry ? entry.title : "";
dom.fieldTags.value = entry ? entry.tags.join(", ") : "";
dom.fieldBody.value = entry ? entry.body : "";
dom.fieldNotes.value = entry ? entry.notes : "";
dom.fieldPinned.checked = entry ? entry.pinned : false;
dom.deleteEntryBtn.hidden = !entry;
dom.overlay.hidden = false;
dom.editorPanel.classList.add("is-open");
dom.editorPanel.setAttribute("aria-hidden", "false");
setTimeout(() => dom.fieldTitle.focus(), 50);
}
function closeEditor() {
dom.editorPanel.classList.remove("is-open");
dom.editorPanel.setAttribute("aria-hidden", "true");
setTimeout(() => { dom.overlay.hidden = true; }, 180);
state.editingId = null;
dom.editorForm.reset();
}
dom.editorForm.addEventListener("submit", (evt) => {
evt.preventDefault();
if (window.RedlineGuard && !window.RedlineGuard.throttle("save")) {
showToast("Slow down a moment.");
return;
}
const payload = {
title: dom.fieldTitle.value.trim(),
tags: dom.fieldTags.value,
body: dom.fieldBody.value,
notes: dom.fieldNotes.value,
pinned: dom.fieldPinned.checked,
};
if (!payload.title || !payload.body.trim()) {
showToast("Title and prompt text are required.");
return;
}
if (state.editingId) {
RedlineStore.update(state.editingId, payload);
showToast("Entry updated.");
} else {
RedlineStore.create(payload);
showToast("Entry saved.");
}
closeEditor();
renderTags();
renderList();
});
dom.deleteEntryBtn.addEventListener("click", () => {
if (!state.editingId) return;
if (!confirm("Delete this entry? This can't be undone.")) return;
RedlineStore.remove(state.editingId);
showToast("Entry deleted.");
closeEditor();
renderTags();
renderList();
});
el("newEntryBtn").addEventListener("click", () => openEditor(null));
el("closeEditorBtn").addEventListener("click", closeEditor);
el("cancelEditBtn").addEventListener("click", closeEditor);
dom.overlay.addEventListener("click", closeEditor);
document.addEventListener("keydown", (e) => {
if (e.key === "Escape" && dom.editorPanel.classList.contains("is-open")) closeEditor();
});
let searchDebounce = null;
dom.searchInput.addEventListener("input", (e) => {
clearTimeout(searchDebounce);
searchDebounce = setTimeout(() => {
state.query = e.target.value;
renderList();
}, 120);
});
dom.sortSelect.addEventListener("change", (e) => {
state.sort = e.target.value;
renderList();
});
el("exportBtn").addEventListener("click", () => {
const json = RedlineStore.exportJSON();
const blob = new Blob([json], { type: "application/json" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `redline-export-${new Date().toISOString().slice(0, 10)}.json`;
a.click();
URL.revokeObjectURL(url);
showToast("Export downloaded.");
});
el("importInput").addEventListener("change", (e) => {
const file = e.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = () => {
try {
const added = RedlineStore.importJSON(reader.result);
showToast(`Imported ${added} ${added === 1 ? "entry" : "entries"}.`);
renderTags();
renderList();
} catch (err) {
showToast("Import failed: " + err.message);
}
e.target.value = "";
};
reader.readAsText(file);
});
renderTags();
renderList();
})();
