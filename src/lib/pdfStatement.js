// Extração de texto de PDFs de extrato/fatura, no navegador (pdf.js).
// A biblioteca é pesada, então o import é dinâmico: ela só carrega
// quando a pessoa escolhe um arquivo PDF no "Ficar em dia".
// PDFs escaneados (imagem, sem camada de texto) voltam vazios — quem
// chama avisa e sugere exportar CSV/OFX pelo app do banco.

export async function extractPdfText(file) {
  const pdfjs = await import('pdfjs-dist')

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
  }

  const data = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data }).promise

  const lines = []
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()

    // Agrupa os itens da página por linha (altura Y parecida) e ordena
    // cada linha por X, reconstruindo as linhas como o olho lê.
    const byLine = new Map()
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5] / 3) * 3
      if (!byLine.has(y)) byLine.set(y, [])
      byLine.get(y).push({ x: item.transform[4], str: item.str })
    }

    // No PDF, o Y cresce de baixo pra cima: maior Y = linha mais alta.
    const sortedYs = [...byLine.keys()].sort((a, b) => b - a)
    for (const y of sortedYs) {
      const line = byLine.get(y)
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (line) lines.push(line)
    }
  }

  return lines.join('\n')
}
