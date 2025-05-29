import pdf from 'html-pdf-node';

/**
 * Generate an A4 PDF from an HTML string or a URL.
 *
 * @param source  Either raw HTML (string) or an absolute URL.
 *                Pass `"<html>…"` to render inline content, or
 *                `"https://example.com/print/123"` to render a live page.
 * @param fileName Optional name that will be embedded in the PDF metadata.
 * @param extra    Optional html‑pdf‑node options to override the defaults.
 * @returns       A Buffer containing the finished PDF.
 *
 * Usage:
 *   const buffer = await generatePdfDoc(htmlString, 'incident‑42.pdf');
 *   res
 *     .set({ 'Content-Type': 'application/pdf' })
 *     .send(buffer);
 */
export async function generatePdfDoc(
  source: string,
  fileName = 'document.pdf',
  extra: Partial<pdf.Options> = {}
): Promise<Buffer> {
  const file =
    source.trim().startsWith('<') || source.trim().startsWith('<!DOCTYPE')
      ? { content: source }
      : { url: source };

  const options: pdf.Options = {
    format: 'A4',
    margin: { top: '1cm', bottom: '1cm', left: '1.5cm', right: '1.5cm' },
    printBackground: true,
    ...extra,
  };

  // html‑pdf‑node returns Buffer when `path` is *not* supplied; otherwise void
  const result = await pdf.generatePdf(file, options); // Buffer | void

  if (result === undefined) {
    throw new Error('html-pdf-node returned void (did you set options.path?)');
  }

  // TypeScript now narrows result to Buffer
  (result as { name?: string }).name = fileName;
  return result;
}
