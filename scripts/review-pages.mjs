import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';

const review = JSON.parse(await readFile(new URL('./delivery-review.json', import.meta.url), 'utf8'));
const words = (html) => html.replace(/<[^>]*>/g, ' ').match(/[\p{L}\p{N}]+/gu) ?? [];
export function hasSubstantialContent(html) {
  const body = html.replace(/<(head|script|style|nav|footer|h1)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  return words(body).length >= 60;
}

export async function listHtml(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`No se admiten enlaces simbólicos: ${entry.name}`);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listHtml(path.join(directory, entry.name), relative));
    else if (/\.html?$/i.test(entry.name)) files.push(relative);
  }
  return files.sort();
}

// Only text nodes are edited: paths, CSS and external URLs remain intact.
const corrections = [
  [/\bLeon XVI\b/g, 'León XIV'], [/\bLeón XVI\b/g, 'León XIV'],
  [/\bleon XVI\b/g, 'León XIV'], [/\bleon XIV\b/g, 'León XIV'], [/\bLeon XIV\b/g, 'León XIV'],
  [/¿Que\b/g, '¿Qué'], [/¿que\b/g, '¿Qué'], [/¿Quien\b/g, '¿Quién'],
  [/\bdia\b/g, 'día'], [/\bLeon\b/g, 'León'], [/\bAdemas\b/g, 'Además'],
  [/\bmas actividades\b/g, 'más actividades'], [/\bpaises\b/g, 'países'],
  [/\bEtc\./g, 'etc.'], [/\bpaginas\b/g, 'páginas'], [/\btambien\b/g, 'también'],
  [/\binformacion\b/g, 'información'], [/\bInformacion\b/g, 'Información'],
  [/\bsientifica\b/g, 'científica'], [/\bcientificad\b/g, 'científica'],
  [/\boficiel\b/g, 'oficial'], [/\bdel vatican\b/g, 'del Vaticano'],
  [/\bDeficicion\b/g, 'Definición'], [/\bDefinición y Concepto\b/g, 'Definición y concepto'],
  [/\bpastorial\b/g, 'pastoral'], [/\belprimer\b/g, 'el primer'],
  [/\bSu Familia\b/g, 'Su familia'], [/\bPrincipales Pilares\b/g, 'Principales pilares'],
  [/Nombre y Apellido completo:/g, 'Nombre y apellido completos: '],
  [/Derecho\s+la información científica/g, 'Derecho a la información científica'],
  [/DERECHO DE LA SALUD/g, 'DERECHO A LA SALUD'], [/Derecho de la Salud/g, 'Derecho a la salud'],
  [/9\.°/g, '9.º'],
];

export function correctText(html) {
  return html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]*>)/gi)
    .map((part) => {
      if (part.startsWith('<')) return part;
      for (const [pattern, replacement] of corrections) part = part.replace(pattern, replacement);
      return part;
    }).join('');
}

export async function reviewPages(directory, folder) {
  const settings = review[folder] ?? {};
  const pages = new Map();
  const excluded = [];
  for (const file of await listHtml(directory)) {
    let html = (await readFile(path.join(directory, file), 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const pageSettings = settings.pages?.[file] ?? {};
    if (pageSettings.truncateAfterFirstFooter) html = html.slice(0, html.indexOf('</footer>') + '</footer>'.length) + '\n</body>\n</html>\n';
    for (const [before, after] of pageSettings.replacements ?? []) html = html.replaceAll(before, after);
    const reason = !hasSubstantialContent(html) ? (settings.exclude?.[file] ?? 'Sin desarrollo suficiente del contenido (menos de 60 palabras fuera del título y la navegación).') : null;
    if (reason) { excluded.push({ file, reason }); continue; }
    html = correctText(html).replace(/(<html\b[^>]*\blang\s*=\s*)["']en["']/i, '$1"es"');
    pages.set(file, html);
  }
  // Remove unavailable local image references and links to empty/missing pages.
  const repairs = [];
  for (const [file, original] of pages) {
    let html = original;
    for (const match of [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi)]) {
      const src = match[1] ?? match[2] ?? match[3];
      if (/^(?:[a-z]+:|\/\/|\/|#)/i.test(src)) continue;
      try { await access(path.resolve(directory, path.dirname(file), decodeURIComponent(src.split(/[?#]/)[0]))); }
      catch { html = html.replace(match[0], ''); repairs.push(`${file}: imagen no entregada ${src}`); }
    }
    html = html.replace(/<a\b([^>]*?)\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')([^>]*)>[\s\S]*?<\/a>/gi, (tag, _before, double, single) => {
      const href = double ?? single;
      if (/^(?:[a-z]+:|\/\/|\/|#)/i.test(href)) return tag;
      const destination = path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent(href.split(/[?#]/)[0])));
      const actual = [...pages.keys()].find((name) => name.toLowerCase() === destination.toLowerCase());
      if (actual && actual !== destination) {
        const suffix = href.match(/[?#].*$/)?.[0] ?? '';
        const repaired = encodeURI(path.posix.relative(path.posix.dirname(file), actual)) + suffix;
        repairs.push(`${file}: mayúsculas corregidas en el enlace a ${actual}`);
        return tag.replace(/(\bhref\s*=\s*)(["'])[^"']*\2/i, `$1"${repaired}"`);
      }
      if (/\.html?$/i.test(destination) && !pages.has(destination)) { repairs.push(`${file}: enlace retirado a ${destination}`); return ''; }
      return tag;
    });
    pages.set(file, html);
  }
  // Add only missing connections, leaving existing student navigation in place.
  for (const [file, original] of pages) {
    let html = original;
    const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)].map((match) => {
      try { return path.posix.normalize(path.posix.join(path.posix.dirname(file), decodeURIComponent((match[1] ?? match[2]).split(/[?#]/)[0]))); } catch { return ''; }
    });
    const missing = [...pages].filter(([other]) => other !== file && !links.includes(other));
    if (missing.length) {
      const navigation = missing.map(([other, content]) => {
        const title = (content.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? content.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? 'Otra página del proyecto').replace(/<[^>]*>/g, '').trim().replace(/\s+/g, ' ');
        const href = encodeURI(path.posix.relative(path.posix.dirname(file), other));
        return `<a href="${href}" style="color:inherit;text-decoration:underline">${title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</a>`;
      }).join(' · ');
      html = html.replace(/<body\b[^>]*>/i, (tag) => `${tag}\n<nav aria-label="Otras páginas del proyecto" style="padding:14px 20px;text-align:center;font:14px Arial,sans-serif;background:#f2f0e9;color:#202124">${navigation}</nav>`);
      repairs.push(`${file}: conexión añadida a ${missing.map(([other]) => other).join(', ')}`);
    }
    pages.set(file, html);
  }
  const entry = [...pages.keys()].find((file) => file.toLowerCase() === 'index.html') ?? [...pages.keys()][0];
  const assets = new Map();
  if (settings.styleFile) {
    try { await access(path.join(directory, 'styles.css')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      assets.set('styles.css', await readFile(new URL(`./student-styles/${settings.styleFile}`, import.meta.url), 'utf8'));
      repairs.push('styles.css: presentación agregada para el HTML entregado sin CSS');
    }
  }
  return { pages, entry, excluded, repairs, assets };
}
