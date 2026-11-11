import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRoster, firstSurname, importDeliveries, matchFolder } from './import-deliveries.mjs';
import { correctText, hasSubstantialContent, reviewPages } from './review-pages.mjs';
import { makeResponsive } from './responsive-pages.mjs';

const roster = createRoster(JSON.parse(await readFile(new URL('./roster.json', import.meta.url), 'utf8')));

test('short names preserve compound surnames and unique IDs', () => {
  assert.equal(firstSurname('Di Palma Mesa'), 'Di Palma');
  assert.equal(firstSurname('Lopez de Lacalle Garelli'), 'Lopez');
  assert.equal(new Set(roster.map((student) => student.id)).size, roster.length);
  assert.equal(roster.find((student) => student.id === '9c-juan-di-palma').firstName, 'Juan');
});

test('shared work is resolved using author credits', () => {
  assert.deepEqual(matchFolder('Bonifacino y Di Palma', 'Facundo Bonifacino y Juan Cruz Di Palma', roster).map((student) => student.id), ['9c-facundo-bonifacino', '9c-juan-di-palma']);
});

test('ambiguous and unknown names require an explicit mapping', () => {
  assert.throws(() => matchFolder('Di Palma', '', roster), /ambigüedad/);
  assert.throws(() => matchFolder('Desconocido', '', roster), /ambigüedad/);
  assert.equal(matchFolder('Di Palma', '', roster, ['9a-bautista-di-palma'])[0].group, '9A');
  assert.equal(matchFolder('Juan Cruz Di Palma', '', roster)[0].group, '9C');
});

test('import copies shared assets once, shortens credits, and is repeatable', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'pallotti-import-'));
  const source = path.join(temporary, 'input');
  const folder = path.join(source, 'Bonifacino y Di Palma');
  const output = path.join(temporary, 'output');
  await mkdir(path.join(folder, 'imagenes'), { recursive: true });
  const original = `<html><head></head><body><p>${'Contenido del proyecto. '.repeat(25)}</p><p><strong>Creadores:</strong> Facundo Bonifacino y Juan Cruz Di Palma</p><a href="papa.html">Otra página</a><img src="imagenes/a.svg"><img src="imagenes/a.svg"></body></html>`;
  await writeFile(path.join(folder, 'index.html'), original);
  await writeFile(path.join(folder, 'papa.html'), original);
  await writeFile(path.join(folder, 'imagenes/a.svg'), '<svg/>');
  assert.deepEqual(await importDeliveries(source, output), { projects: 1, students: 2 });
  const catalogue = await readFile(path.join(output, 'src/data/deliveries.json'), 'utf8');
  const students = JSON.parse(catalogue);
  assert.equal(students[0].projectPath, students[1].projectPath);
  assert.ok(!catalogue.includes('Juan Cruz') && !catalogue.includes('fullFirstName'));
  const published = await readFile(path.join(output, 'public/estudiantes/bonifacino-y-di-palma/index.html'), 'utf8');
  assert.ok(published.includes('Juan Di Palma') && !published.includes('Juan Cruz'));
  assert.ok(published.includes('name="viewport"') && published.includes('loading="lazy"'));
  assert.ok(published.includes('href="/estudiantes/_responsive.css"'));
  assert.ok((await readFile(path.join(output, 'public/estudiantes/_responsive.css'), 'utf8')).includes('@media (max-width: 768px)'));
  assert.equal(await readFile(path.join(folder, 'index.html'), 'utf8'), original);
  await importDeliveries(source, output);
  assert.equal(await readFile(path.join(output, 'src/data/deliveries.json'), 'utf8'), catalogue);
  // A later delivery is picked up without editing the website.
  await mkdir(path.join(source, 'Acuña'));
  await writeFile(path.join(source, 'Acuña/index.html'), `<html><head></head><body><p>${'Contenido del proyecto. '.repeat(25)}</p></body></html>`);
  assert.deepEqual(await importDeliveries(source, output), { projects: 2, students: 3 });
  const updated = await readFile(path.join(output, 'src/data/deliveries.json'), 'utf8');
  // A bad batch leaves the existing catalogue intact.
  await mkdir(path.join(source, 'Di Palma'));
  await writeFile(path.join(source, 'Di Palma/index.html'), '<html/>');
  await assert.rejects(importDeliveries(source, output), /ambigüedad/);
  assert.equal(await readFile(path.join(output, 'src/data/deliveries.json'), 'utf8'), updated);
});

test('review omits title-only pages, chooses the real entry, and removes broken references', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pallotti-review-'));
  await writeFile(path.join(directory, 'index.html'), '<html><head><title>Trabajo</title></head><body><nav>Inicio</nav><h1>Información científica</h1></body></html>');
  await writeFile(path.join(directory, 'papa.html'), `<html><body><h1>Leon XIV</h1><a href="index.html">Otra página</a><img src="falta.jpg"><p>${'Contenido desarrollado del trabajo. '.repeat(20)}</p></body></html>`);
  const result = await reviewPages(directory, 'Sofia Reina y Eva Paiva');
  assert.equal(result.entry, 'papa.html');
  assert.equal(result.excluded.length, 1);
  assert.ok(!result.pages.get('papa.html').includes('index.html'));
  assert.ok(!result.pages.get('papa.html').includes('falta.jpg'));
  assert.ok(result.pages.get('papa.html').includes('León XIV'));
  // A completed page becomes eligible automatically on the next import.
  await writeFile(path.join(directory, 'index.html'), `<html><body><h1>Derecho a la salud</h1><p>${'Contenido desarrollado del trabajo. '.repeat(20)}</p></body></html>`);
  const completed = await reviewPages(directory, 'Sofia Reina y Eva Paiva');
  assert.equal(completed.pages.size, 2);
  assert.ok(completed.pages.get('index.html').includes('href="papa.html"'));
  assert.ok(completed.pages.get('papa.html').includes('href="index.html"'));
});

test('spelling changes text while preserving URLs, styles and scripts', () => {
  const html = '<a href="Leon XIV.html">¿Quien es Leon XIV?</a><style>.pastorial{color:red}</style><script>const text="Leon XIV";</script>';
  assert.equal(correctText(html), '<a href="Leon XIV.html">¿Quién es León XIV?</a><style>.pastorial{color:red}</style><script>const text="Leon XIV";</script>');
  assert.equal(hasSubstantialContent('<h1>Un título</h1><nav>Inicio</nav>'), false);
});

test('uppercase HTML filenames retain mutual navigation and fragment links', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'pallotti-case-'));
  const text = `<p>${'Contenido desarrollado del trabajo. '.repeat(20)}</p>`;
  await writeFile(path.join(directory, 'INDEX.HTML'), `<html><body><h1>Inicio</h1><a href="papa.html">Papa</a>${text}</body></html>`);
  await writeFile(path.join(directory, 'PAPA.HTML'), `<html><body><h1>Papa</h1><a href="index.html#derechos">Inicio</a>${text}</body></html>`);
  const reviewed = await reviewPages(directory, 'Case test');
  assert.equal(reviewed.entry, 'INDEX.HTML');
  assert.ok(reviewed.pages.get('INDEX.HTML').includes('href="PAPA.HTML"'));
  assert.ok(reviewed.pages.get('PAPA.HTML').includes('href="INDEX.HTML#derechos"'));
  assert.ok(!reviewed.pages.get('INDEX.HTML').includes('Otras páginas del proyecto'));
});

test('missing student stylesheet is supplied without changing the source or replacing a later submission', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'pallotti-style-'));
  const source = path.join(temporary, 'input');
  const folder = path.join(source, 'Sofia Alfaro');
  const output = path.join(temporary, 'output');
  await mkdir(folder, { recursive: true });
  const html = `<html><head><link rel="stylesheet" href="styles.css"></head><body><h1>Decido con responsabilidad</h1><p>${'Contenido desarrollado del trabajo. '.repeat(20)}</p></body></html>`;
  await writeFile(path.join(folder, 'index.html'), html);
  await importDeliveries(source, output);
  const publishedCss = path.join(output, 'public/estudiantes/sofia-alfaro/styles.css');
  assert.ok((await readFile(publishedCss, 'utf8')).includes('@media'));
  assert.equal(await readFile(path.join(folder, 'index.html'), 'utf8'), html);
  await assert.rejects(readFile(path.join(folder, 'styles.css')), { code: 'ENOENT' });
  await importDeliveries(source, output);
  assert.ok((await readFile(publishedCss, 'utf8')).includes('@media'));
  await writeFile(path.join(folder, 'styles.css'), 'body { color: red; }');
  await importDeliveries(source, output);
  assert.equal(await readFile(publishedCss, 'utf8'), 'body { color: red; }');
});

test('mobile adaptation repairs viewport and keeps tables, content and original CSS intact on reimport', () => {
  const html = '<html lang="es"><head><meta name="viewport" content="widtdevice-widthh="><link rel="stylesheet" href="original.css"></head><body><h1>Mi proyecto</h1><table><caption>Datos</caption><tr><td>Información</td></tr></table><p>ChatGPT es IA y puede cometer errores.</p></body></html>';
  const adapted = makeResponsive(html, 'test-project');
  const repeated = makeResponsive(adapted, 'test-project');
  assert.ok(adapted.includes('width=device-width, initial-scale=1.0'));
  assert.ok(adapted.includes('href="original.css"'));
  assert.ok(adapted.includes('<caption>Datos</caption>'));
  assert.ok(adapted.includes('ChatGPT es IA y puede cometer errores.'));
  assert.equal((repeated.match(/class="student-table-scroll"/g) ?? []).length, 1);
  assert.equal((repeated.match(/name="viewport"/g) ?? []).length, 1);
  assert.equal((repeated.match(/data-student-responsive="true"/g) ?? []).length, 1);
  assert.ok(repeated.indexOf('original.css') < repeated.indexOf('_responsive.css'));
});
