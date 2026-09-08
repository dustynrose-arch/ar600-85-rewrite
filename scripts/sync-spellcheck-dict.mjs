import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "dictionary-en");
const dest = join(root, "public", "spellcheck");
mkdirSync(dest, { recursive: true });
copyFileSync(join(src, "index.aff"), join(dest, "en.aff"));
copyFileSync(join(src, "index.dic"), join(dest, "en.dic"));
copyFileSync(join(src, "license"), join(dest, "LICENSE"));
console.log("synced hunspell en dictionary into public/spellcheck");
