/** Layout-only compatibility layer; the original desktop styles stay in charge. */
export function makeResponsive(html, project) {
  html = html.replace(/<html\b([^>]*)>/i, (_tag, attributes) => {
    const clean = attributes.replace(/\sdata-student-project\s*=\s*["'][^"']*["']/gi, '');
    return `<html${clean} data-student-project="${project}">`;
  });
  html = html.replace(/<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/gi, '');
  html = html.replace(/<head\b[^>]*>/i, (tag) => `${tag}\n<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  if (!/\bdata-student-responsive\s*=/i.test(html)) {
    html = html.replace(/<\/head>/i, '<link rel="stylesheet" href="/estudiantes/_responsive.css" data-student-responsive="true">\n</head>');
  }
  html = html.replace(/<table\b(?![^>]*data-student-responsive-table)[^>]*>[\s\S]*?<\/table>/gi, (table) =>
    `<div class="student-table-scroll" role="region" aria-label="Tabla con desplazamiento horizontal" tabindex="0">${table.replace(/<table\b/i, '<table data-student-responsive-table="true"')}</div>`);
  return html;
}
