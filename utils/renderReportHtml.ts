// lib/renderReportHtml.ts

import handlebars from 'handlebars';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IncidentReportFetch } from '../models/interfaces/incidentReport.interface.js';

interface AnyRecord {
  [key: string]: unknown;
}

// Date formatting helpers
const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatIfDate(str: string): string {
  // YYYY‑MM‑DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(str + 'T00:00:00');
    return dateFmt.format(d);
  }
  // ISO‑8601 timestamp
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    return dateTimeFmt.format(new Date(str));
  }
  return str;
}

/**
 * Convert undefined / null / empty values to `"None"`,
 * booleans to **Yes/No**, and leave everything else as-is.
 */
function normaliseValue(v: unknown): unknown {
  if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) return 'None';
  if (typeof v === 'string') return formatIfDate(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v) && v.length === 0) return 'None';
  return v;
}

function normaliseReport(report: IncidentReportFetch): AnyRecord {
  const out: AnyRecord = {};
  for (const [k, v] of Object.entries(report)) {
    out[k] = normaliseValue(v);
  }
  return out;
}

export async function renderReportHtml(
  report: IncidentReportFetch,
  residentName: string,
  staffName: string
): Promise<string> {
  const templatePath = path.join(process.cwd(), 'templates', 'incidentReport.hbs');
  const templateSrc = await fs.readFile(templatePath, 'utf-8');
  const template = handlebars.compile(templateSrc);

  const html = template({
    ...normaliseReport(report),
    residentName,
    staffName,
    createdOn: new Date().toLocaleString(),
  });

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Incident #${report.id}</title>
    <style>
      @page { size: A4; margin: 1.5cm; }
      body      { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 13px; color:#222; }
      h1        { font-size: 24px; margin-bottom: .3em; }
      h2        { font-size: 18px; margin-bottom: .25em; color:#003366; }
      h3        { font-size: 15px; margin-bottom: .2em; color:#003366; }
      .section  { margin-bottom: 1.2em; }
      .label    { font-weight: 600; color:#555; display:inline-block; min-width: 220px; }
      .value    { display:inline-block; }
      ul        { margin: .3em 0 .3em 1.2em; padding: 0; }
      li        { margin-bottom:.2em; }
      footer    { margin-top: 3em; font-size: 11px; color:#666; text-align: right; }
      hr        { border:0; border-top:1px solid #ddd; margin:1em 0; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}
