(function (global) {
"use strict";
const STORAGE_KEY = "redline:prompts:v1";
function uid() {
return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}
function readAll() {
try {
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return [];
const parsed = JSON.parse(raw);
return Array.isArray(parsed) ? parsed : [];
} catch (err) {
console.error("[Redline] Could not read storage, starting fresh.", err);
return [];
}
}
function writeAll(entries) {
localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
const RedlineStore = {
list() {
return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
},
get(id) {
return readAll().find((e) => e.id === id) || null;
},
create({ title, body, tags, notes, pinned }) {
const entries = readAll();
const now = Date.now();
const entry = {
id: uid(),
title: (title || "Untitled").trim(),
body: body || "",
notes: notes || "",
tags: normalizeTags(tags),
pinned: !!pinned,
createdAt: now,
updatedAt: now,
};
entries.push(entry);
writeAll(entries);
return entry;
},
update(id, patch) {
const entries = readAll();
const idx = entries.findIndex((e) => e.id === id);
if (idx === -1) return null;
const updated = {
...entries[idx],
...patch,
tags: patch.tags !== undefined ? normalizeTags(patch.tags) : entries[idx].tags,
updatedAt: Date.now(),
};
entries[idx] = updated;
writeAll(entries);
return updated;
},
remove(id) {
const entries = readAll().filter((e) => e.id !== id);
writeAll(entries);
},
allTags() {
const counts = new Map();
readAll().forEach((e) => {
e.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
});
return [...counts.entries()].sort((a, b) => b[1] - a[1]);
},
exportJSON() {
return JSON.stringify({ exportedAt: new Date().toISOString(), entries: readAll() }, null, 2);
},
importJSON(jsonText) {
const parsed = JSON.parse(jsonText);
const incoming = Array.isArray(parsed) ? parsed : parsed.entries;
if (!Array.isArray(incoming)) throw new Error("Unrecognized file format.");
const existing = readAll();
const existingIds = new Set(existing.map((e) => e.id));
let added = 0;
incoming.forEach((raw) => {
if (!raw || typeof raw.title !== "string") return;
const entry = {
id: existingIds.has(raw.id) ? uid() : raw.id || uid(),
title: raw.title,
body: raw.body || "",
notes: raw.notes || "",
tags: normalizeTags(raw.tags),
pinned: !!raw.pinned,
createdAt: typeof raw.createdAt === "number" ? raw.createdAt : Date.now(),
updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
};
existing.push(entry);
existingIds.add(entry.id);
added++;
});
writeAll(existing);
return added;
},
};
function normalizeTags(tags) {
if (Array.isArray(tags)) {
return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
}
if (typeof tags === "string") {
return [...new Set(tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
}
return [];
}
global.RedlineStore = RedlineStore;
})(window);
