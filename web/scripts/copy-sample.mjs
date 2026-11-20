// Développement local : copie les données d'exemple dans public/data si elles manquent.
import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = fileURLToPath(new URL("../../seed/sample/", import.meta.url));
const dst = fileURLToPath(new URL("../public/data/", import.meta.url));
if (existsSync(dst + "latest/meta.json")) {
  console.log("public/data déjà présent, rien à copier.");
} else {
  cpSync(src, dst, { recursive: true });
  console.log("Données d'exemple copiées dans public/data.");
}
