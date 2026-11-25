import { readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = await realpath(fileURLToPath(new URL("../", import.meta.url)));

async function exportGradeAccess(file) {
  const source = await realpath(file);
  const relative = path.relative(root, source);
  if (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(".." + path.sep)) {
    throw new Error("Guardá el archivo privado fuera del repositorio.");
  }

  const catalogue = JSON.parse(await readFile(path.join(root, "src/data/deliveries.json"), "utf8"));
  const names = new Map(catalogue.map(({ id, firstName, lastName }) => [id, firstName + " " + lastName]));
  const records = new Map();
  const codes = new Set();
  const lines = (await readFile(source, "utf8")).split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const row = line.trim();
    if (!row || row.startsWith("#")) continue;

    const parts = row.split("|").map(part => part.trim());
    const [id, name, grade, code, feedback] = parts;
    if (parts.length !== 5 || names.get(id) !== name || records.has(id)) {
      throw new Error("Estudiante incorrecto o repetido en la línea " + (index + 1) + ".");
    }
    if (grade !== "Pendiente" && !/^(?:[1-9]|10)$/.test(grade)) {
      throw new Error("Nota inválida para " + id + ".");
    }
    const digits = code.replace("-", "");
    if (!/^\d{3}-\d{3}$/.test(code) || codes.has(digits)) {
      throw new Error("Código inválido o repetido para " + id + ".");
    }
    if (feedback.length > 320 || (grade === "Pendiente" && feedback)) {
      throw new Error("Devolución inválida para " + id + ".");
    }
    codes.add(digits);
    records.set(id, [digits, grade === "Pendiente" ? null : Number(grade), feedback]);
  }

  if (records.size !== names.size) throw new Error("Falta una fila para algún estudiante de la galería.");
  const envPath = path.join(root, ".env.local");
  const existing = await readFile(envPath, "utf8").catch(error => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const variable = /^(?:export\s+)?GRADE_ACCESS\s*=[^\r\n]*/m;
  const entry = "GRADE_ACCESS=" + JSON.stringify(Object.fromEntries(records));
  const contents = variable.test(existing)
    ? existing.replace(variable, () => entry)
    : [existing.trimEnd(), entry].filter(Boolean).join("\n") + "\n";
  await writeFile(envPath, contents);
  console.log(records.size + " accesos preparados en .env.local.");
}

try {
  if (!process.argv[2]) throw new Error("Indicá la ruta al archivo privado de accesos.");
  await exportGradeAccess(process.argv[2]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
