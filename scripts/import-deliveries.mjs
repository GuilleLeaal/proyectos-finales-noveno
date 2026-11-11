import { cp, mkdir, readFile, readdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { reviewPages } from './review-pages.mjs';
import { makeResponsive } from './responsive-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = (value) => normalize(value).replaceAll(' ', '-');
const contains = (text, name) => ` ${normalize(text)} `.includes(` ${normalize(name)} `);

export function firstSurname(value) {
  const words = value.split(/\s+/);
  const particles = new Set(['di', 'de', 'del', 'la', 'las', 'los', 'da', 'dos', 'van', 'von']);
  let end = 0;
  while (particles.has(words[end]?.toLowerCase())) end++;
  return words.slice(0, end + 1).join(' ');
}

export function createRoster(roster) {
  return Object.entries(roster).flatMap(([group, names]) => names.map(([firstName, lastName], index) => ({
    id: `${group.toLowerCase()}-${slug(`${firstName.split(' ')[0]} ${firstSurname(lastName)}`)}`,
    firstName: firstName.split(' ')[0], lastName: firstSurname(lastName), fullFirstName: firstName, fullLastName: lastName,
    group, artwork: (index * 7 + (group === '9A' ? 0 : 3)) % 8,
  })));
}

export function matchFolder(folder, credits, roster, override) {
  if (override) {
    if (!Array.isArray(override) || !override.length) throw new Error(`Asignación inválida: ${folder}`);
    return override.map((id) => {
      const student = roster.find((item) => item.id === id);
      if (!student) throw new Error(`ID desconocido: ${id}`);
      return student;
    });
  }
  const names = folder.split(/\s+(?:y|e)\s+|[,&+;]/i).map((name) => name.trim()).filter(Boolean);
  return names.map((name) => {
    let candidates = roster.filter((student) => contains(name, student.lastName));
    if (candidates.length > 1) {
      const named = candidates.filter((student) => contains(name, `${student.firstName} ${student.lastName}`) || contains(name, `${student.fullFirstName} ${student.lastName}`));
      if (named.length) candidates = named;
    }
    if (candidates.length > 1) candidates = candidates.filter((student) => contains(credits, `${student.fullFirstName} ${student.lastName}`));
    if (candidates.length !== 1) throw new Error(`No se pudo identificar sin ambigüedad «${name}» en «${folder}». Revisá scripts/delivery-overrides.json.`);
    return candidates[0];
  });
}

async function htmlCredits(directory) {
  const parts = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`No se admiten enlaces simbólicos: ${entry.name}`);
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) parts.push(await htmlCredits(target));
    else if (/\.html?$/i.test(entry.name)) {
      const html = await readFile(target, 'utf8');
      parts.push(...(html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) ?? [])
        .filter((paragraph) => /(?:creadores|autores|integrantes)\s*(?:<[^>]*>)*\s*:/i.test(paragraph))
        .map((paragraph) => paragraph.replace(/<[^>]*>/g, ' ')));
    }
  }
  return parts.join(' ');
}

async function prepareHtml(directory, authors, project) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await prepareHtml(target, authors, project);
    else if (/\.html?$/i.test(entry.name)) {
      let html = await readFile(target, 'utf8');
      if (!/<meta\b[^>]*charset\s*=/i.test(html)) {
        html = html.replace(/<head\b[^>]*>/i, (tag) => `${tag}\n<meta charset="UTF-8">`);
      }
      if (!/<meta\b[^>]*name\s*=\s*["']viewport["']/i.test(html)) {
        html = html.replace(/<\/head>/i, '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>');
      }
      html = html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
        if (!/(?:creadores|autores|integrantes)\s*(?:<[^>]*>)*\s*:/i.test(paragraph)) return paragraph;
        for (const author of authors) {
          for (const name of [`${author.fullFirstName} ${author.fullLastName}`, `${author.fullFirstName} ${author.lastName}`, `${author.firstName} ${author.fullLastName}`]) {
            paragraph = paragraph.replaceAll(name, `${author.firstName} ${author.lastName}`);
          }
        }
        return paragraph;
      });
      let images = 0;
      html = html.replace(/<img\b[^>]*>/gi, (tag) => {
        images++;
        return images > 1 && !/\bloading\s*=/i.test(tag) ? tag.replace(/<img\b/i, '<img loading="lazy"') : tag;
      });
      await writeFile(target, makeResponsive(html, project));
    }
  }
}

export async function importDeliveries(source, outputRoot = root) {
  const roster = createRoster(JSON.parse(await readFile(new URL('./roster.json', import.meta.url), 'utf8')));
  const overrides = JSON.parse(await readFile(new URL('./delivery-overrides.json', import.meta.url), 'utf8'));
  const folders = (await readdir(source, { withFileTypes: true })).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (!folders.length) throw new Error('No hay carpetas de entregas. Se conserva el catálogo anterior.');
  const deliveries = [];
  const seen = new Set();
  const projects = new Set();
  const copies = [];
  const report = [];
  // Validate the complete batch before changing the published catalogue.
  for (const folder of folders) {
    const directory = path.join(source, folder.name);
    const project = slug(folder.name);
    if (!project || projects.has(project)) throw new Error(`Nombre de carpeta repetido: ${folder.name}`);
    projects.add(project);
    const authors = matchFolder(folder.name, await htmlCredits(directory), roster, overrides[folder.name]);
    const reviewed = await reviewPages(directory, folder.name);
    report.push({ folder: folder.name, entry: reviewed.entry ?? null, included: [...reviewed.pages.keys()], excluded: reviewed.excluded, repairs: reviewed.repairs });
    if (!reviewed.entry) continue;
    for (const { fullFirstName: _fullFirstName, fullLastName: _fullLastName, ...student } of authors) {
      if (seen.has(student.id)) throw new Error(`Estudiante con más de una entrega: ${student.id}`);
      seen.add(student.id);
      deliveries.push({ ...student, published: true, projectPath: `/estudiantes/${project}/${encodeURI(reviewed.entry)}` });
    }
    copies.push([directory, path.join(outputRoot, 'public', 'estudiantes', project), authors, reviewed]);
  }
  if (!copies.length) throw new Error('Ninguna entrega tiene contenido suficiente. Se conserva el catálogo anterior.');
  for (const [sourcePath, destination, authors, reviewed] of copies) {
    await mkdir(destination, { recursive: true });
    await cp(sourcePath, destination, { recursive: true, filter: (file) => !/\.html?$/i.test(file) || reviewed.pages.has(path.relative(sourcePath, file).split(path.sep).join('/')) });
    for (const { file } of reviewed.excluded) {
      const target = path.resolve(destination, file);
      if (!target.startsWith(path.resolve(destination) + path.sep)) throw new Error('Ruta de exclusión inválida.');
      try { await unlink(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    for (const [file, html] of reviewed.pages) await writeFile(path.join(destination, file), html);
    for (const [file, content] of reviewed.assets) await writeFile(path.join(destination, file), content);
    await prepareHtml(destination, authors, path.basename(destination));
  }
  await cp(new URL('./student-styles/responsive.css', import.meta.url), path.join(outputRoot, 'public', 'estudiantes', '_responsive.css'));
  await mkdir(path.join(outputRoot, 'src', 'data'), { recursive: true });
  await writeFile(path.join(outputRoot, 'src', 'data', 'deliveries.json'), `${JSON.stringify(deliveries, null, 2)}\n`);
  await mkdir(path.join(outputRoot, 'scripts'), { recursive: true });
  await writeFile(path.join(outputRoot, 'scripts', 'delivery-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  return { projects: copies.length, students: deliveries.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = path.resolve(process.argv[2] ?? path.join(os.homedir(), 'Desktop', 'Proyectos estudiantes'));
  try {
    const result = await importDeliveries(source);
    console.log(`Entregas importadas: ${result.projects} proyectos, ${result.students} estudiantes.\nOrigen: ${source}`);
  } catch (error) {
    console.error(`No se actualizaron las entregas: ${error.message}`);
    process.exitCode = 1;
  }
}
