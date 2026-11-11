# Proyectos Finales 2026 â€” Pallotti

La galería muestra únicamente estudiantes con entregas importadas, con primer nombre y primer apellido. Los apellidos compuestos se conservan: Di Palma. Cada integrante tiene una tarjeta; los integrantes de un mismo equipo comparten los archivos del proyecto.

## Incorporar entregas

1. Dejá cada trabajo en una subcarpeta de `C:\Users\Usuario\Desktop\Proyectos estudiantes`. Conservá las entregas anteriores allí.
2. Cada subcarpeta debe tener sus HTML, CSS e imágenes, respetando la estructura original. Si no existe un `index.html` desarrollado, se abre directamente una de las páginas con contenido.
3. Nombrá las carpetas con los apellidos, por ejemplo `Bonifacino y Di Palma`. También se aceptan nombres y apellidos, comas, `&` o `+` entre integrantes.
4. Desde la carpeta del repositorio, ejecutá:

```powershell
npm run import:projects
npm test
npm run build
```

Para elegir otra carpeta:

```powershell
npm run import:projects -- "D:\Entregas"
```

La importación cruza las carpetas con `scripts/roster.json`. Si hay apellidos repetidos, utiliza los créditos de autoría del HTML. Si no puede identificar a alguien con certeza, se detiene antes de cambiar el catálogo. No publica estudiantes por aproximación. En ese caso, agregá una asignación en `scripts/delivery-overrides.json`, por ejemplo:

```json
{
  "Bonifacino y Di Palma": ["9c-facundo-bonifacino", "9c-juan-di-palma"]
}
```

Los IDs se forman con grupo, primer nombre y primer apellido, en minúsculas y sin tildes. La lista completa queda en las herramientas de importación y no se incluye en el código del navegador.

El proceso copia los trabajos a `public/estudiantes/` y genera `src/data/deliveries.json`. Actualiza automáticamente tarjetas, búsqueda, filtros y contadores. En las copias agrega viewport cuando falta, carga diferida de imágenes desde la segunda imagen y abrevia los nombres en párrafos de créditos identificados como Creadores, Autores o Integrantes. Los originales del escritorio se conservan.

Repetir el comando actualiza las mismas entregas. Los nombres ambiguos, un estudiante duplicado o una carpeta de entrada vacía detienen la importación. Las entregas sin ninguna página desarrollada no se incorporan. Quitar una entrega del origen la quita del catálogo en la siguiente importación, pero los archivos publicados anteriores no se borran automáticamente.

La web publicada no puede leer el escritorio: agregar carpetas requiere ejecutar la importación, compilar y publicar la nueva versión por el flujo habitual del repositorio. La compilación usa el catálogo guardado y no depende de que exista la carpeta del escritorio en el servidor.

## Desarrollo

```powershell
npm install
npm run dev
```

## Optimización

- Portada y visor de proyectos se descargan por separado. La portada usa una composición de ventanas y tarjetas animadas con CSS; ya no descarga la escultura ni Three.js.
- Se conservan el diseño y las animaciones existentes, incluyendo su pausa fuera de pantalla y con la pestaña oculta.
- La portada inicia el autoscroll por defecto tras 5 segundos, sin parámetros en la URL. Se pausa con la interacción y retoma tras 30 segundos de inactividad; respeta la preferencia de movimiento reducido.
- Fuentes con conexiones anticipadas y `display=swap`, descripción de página y favicon propio.
- Vercel conserva los recursos con hash durante un año y revalida los trabajos de estudiantes para mostrar actualizaciones.
- El catálogo incluye solo las entregas. No hay tarjetas de trabajos pendientes.

`npm test` comprueba identificación, apellidos compuestos, entregas compartidas, importación repetible, nuevas entregas y conservación del catálogo ante nombres ambiguos. `npm run build` comprueba TypeScript y genera `dist/`.

## Revisión de páginas al importar

Se omiten las páginas vacías, con solo título o sin desarrollo suficiente (menos de 60 palabras fuera de encabezado principal, navegación, estilos, scripts y pie). Este umbral identifica borradores, no evalúa la calidad del trabajo. Las decisiones revisadas y reparaciones puntuales están en `scripts/delivery-review.json`; el resultado de cada importación queda en `scripts/delivery-report.json`.

Si ambas páginas tienen contenido se conservan y se agregan solo las conexiones que falten, con enlaces simples. Los enlaces a páginas descartadas o inexistentes se retiran. Las imágenes locales no entregadas se quitan de la copia para evitar cuadros rotos. Se corrigen errores de ortografía conocidos solo en el texto, sin cambiar las rutas, los estilos, los enlaces externos ni el contenido de los scripts.

Si completan una página antes descartada y supera el umbral de contenido, se incorpora en la siguiente importación. Las correcciones no modifican los originales del escritorio. Esta revisión no verifica los datos históricos ni las afirmaciones de las páginas.

## Galería y recorrido

Todos los estudiantes con entrega cargan al abrir la galería, sin paginación ni botón de carga adicional. Las tarjetas comparten las mismas dimensiones y tipografía en cada tamaño de pantalla; no hay tarjetas destacadas. El autoscroll puede recorrer la lista completa.

La transición «Del aula a la web» ocupa 230svh (210svh en móvil), y la entrada azul de la galería, 72svh (70svh en móvil). El círculo termina de cubrir la pantalla al llegar al cambio de sección para reducir el tramo azul sin contenido.

La importación también corrige enlaces HTML con mayúsculas distintas al nombre del archivo y conserva los fragmentos internos, para que funcionen al publicar en servidores que distinguen mayúsculas.

## Presentación de HTML sin CSS

La excepción solicitada para Sofía Alfaro está guardada en `scripts/student-styles/sofia-alfaro.css`. La importación la incorpora como `styles.css` únicamente mientras falte ese archivo en su carpeta original. Si entrega un CSS propio, se respeta el nuevo archivo. No se modifica el original del escritorio.

## Adaptación para celular

La importación incorpora `/estudiantes/_responsive.css` a cada página. Las reglas de adaptación se activan solo hasta 768 px y conservan colores, fondos, familias tipográficas y estilos originales. Ajustan las imágenes al ancho disponible, apilan las columnas que no caben y pasan a flujo normal los elementos con coordenadas fijas que se superponían.

Las tablas conservan su estructura y se pueden desplazar horizontalmente dentro de su propio contenedor en celular. En escritorio ese contenedor no agrega una caja visual. Se normaliza el viewport, incluyendo los que venían mal escritos. El archivo mantenible es `scripts/student-styles/responsive.css`; `scripts/responsive-pages.mjs` aplica el enlace y los contenedores al importar, sin modificar los originales del escritorio.
