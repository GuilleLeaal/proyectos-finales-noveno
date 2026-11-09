# Proyectos Finales 2026 — Proyecto recuperado

## Qué se conservó

Se conservaron los archivos de la copia enviada por el docente y el diseño aprobado:
- Hero V2 con su escultura 3D y animaciones.
- Transición cinética «Del aula a la web».
- Entrada visual a la galería.
- Galería de 48 estudiantes sin fotografías, filtros y buscador.
- Páginas individuales `/proyectos/:id` listas para alojar los trabajos.
- Los estilos, datos, recursos adicionales y las configuraciones de publicación existentes.

## Reparaciones realizadas

1. Se recuperó `index.html`, ausente en el ZIP recibido.
2. Se recuperó `vite.config.ts`, ausente en el ZIP recibido.
3. Se recuperó `tsconfig.json`, utilizando como referencias los `tsconfig.app.json` y `tsconfig.node.json` existentes.
4. Se arregló en `src/components/gallery/GalleryEntrance.tsx` la importación `./GalleryEntrance` por `./GalleryEntrance.css`.
5. Se hizo coincidir `package.json` con las dependencias del `package-lock.json` aportado (en la copia recibida tenían versiones distintas).

No se modificaron los componentes del Hero V2, ni la escultura, ni las animaciones y estilos aprobados.

## Cómo ejecutar en Windows

1. Hacé una copia de seguridad de tu carpeta actual `proyectos-finales-2026` (por ejemplo, renombrala `proyectos-finales-2026-respaldo`). **No borres tus archivos originales.**
2. Descomprimí este ZIP en `WebProyectos`, dejando esta estructura:

   ```text
   WebProyectos/
     proyectos-finales-2026/
       package.json
       package-lock.json
       index.html
       vite.config.ts
       tsconfig.json
       src/
       public/
   ```
3. Abrí VS Code en **`proyectos-finales-2026`**. No lo abras desde una carpeta por encima que no tenga `package.json`.
4. Desde la terminal de esa carpeta, ejecutá:

   ```powershell
   npm install
   npm run dev
   ```

5. Para comprobar el código y generar una versión de producción, ejecutá:

   ```powershell
   npm run build
   ```

`node_modules` está deliberadamente excluido: npm instalará las dependencias correspondientes a tu sistema operativo. No copies el `node_modules` del proyecto viejo encima.

## Dónde están las páginas de los estudiantes

`src/data/students.ts` contiene la lista de los 48 estudiantes de 9.º A y 9.º C. `src/data/publishedProjects.ts` controla qué proyectos están publicados.

Cuando recibas un proyecto, colocá la carpeta HTML/CSS dentro de `public/estudiantes/<ID>/index.html` y agregá su identificador a `publishedProjectIds`. Si todavía no se publicó, se muestra la pantalla de presentación prevista.

## Validación

- Los tipos de TypeScript fueron comprobados con `tsc -b` sin errores.
- El empaquetado de Vite no se pudo verificar completamente en este entorno porque los `node_modules` del archivo recibido contienen binarios nativos de Windows, mientras que aquí se ejecuta Linux. `npm install` en tu equipo instalará los binarios de Windows adecuados.
- No se alteraron los nombres ni los datos de los estudiantes.

**Importante:** revisar autorización para publicar nombres completos de menores antes de poner la página en internet.
