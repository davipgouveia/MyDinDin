import { formatCurrency } from './format'

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export const exportTransactionsCsv = (transactions = []) => {
  const header = ['Data', 'Descricao', 'Categoria', 'Tipo', 'Valor', 'Responsavel']
  const rows = transactions.map((item) => {
    const rawAmount = Number(item.amount) || 0
    const normalizedAmount = item.type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount)
    return [
      formatDate(item.date || item.transaction_date || item.createdAt || item.created_at),
      item.description || '-',
      item.category || '-',
      item.type === 'income' ? 'Receita' : 'Despesa',
      normalizedAmount.toFixed(2).replace('.', ','),
      item.owner || '-',
    ]
  })

  const csvBody = [header, ...rows]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\n')

  downloadFile(`\uFEFF${csvBody}`, `mydindin-transacoes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;')
}

const aggregateSummary = (transactions = [], fromDate, toDate) => {
  return transactions
    .filter((item) => {
      const txDate = new Date(item.date || item.transaction_date || item.createdAt || item.created_at)
      if (Number.isNaN(txDate.getTime())) return false
      return txDate >= fromDate && txDate <= toDate
    })
    .reduce(
      (acc, item) => {
        const amount = Math.abs(Number(item.amount) || 0)
        if (item.type === 'income') acc.income += amount
        else acc.expense += amount
        return acc
      },
      { income: 0, expense: 0 },
    )
}

export const printMonthlyPdfReport = (transactions = [], summary = { income: 0, expense: 0, balance: 0 }) => {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const yearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const yearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0, 23, 59, 59)

  const currentMonth = aggregateSummary(transactions, monthStart, monthEnd)
  const previousMonth = aggregateSummary(transactions, prevStart, prevEnd)
  const sameMonthLastYear = aggregateSummary(transactions, yearStart, yearEnd)

  const reportRows = transactions
    .filter((item) => {
      const txDate = new Date(item.date || item.transaction_date || item.createdAt || item.created_at)
      if (Number.isNaN(txDate.getTime())) return false
      return txDate >= monthStart && txDate <= monthEnd
    })
    .slice(0, 200)

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatorio Mensal - MyDinDin</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { margin: 0 0 8px; }
      p { margin: 4px 0; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
      .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
      th { background: #f1f5f9; }
    </style>
  </head>
  <body>
    <h1>MyDinDin - Relatorio Mensal</h1>
    <p>Periodo atual: ${monthStart.toLocaleDateString('pt-BR')} a ${monthEnd.toLocaleDateString('pt-BR')}</p>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

    <div class="grid">
      <div class="card"><strong>Receitas (filtro atual)</strong><br/>${formatCurrency(summary.income || 0)}</div>
      <div class="card"><strong>Despesas (filtro atual)</strong><br/>${formatCurrency(summary.expense || 0)}</div>
      <div class="card"><strong>Saldo (filtro atual)</strong><br/>${formatCurrency(summary.balance || 0)}</div>
      <div class="card"><strong>Mes atual</strong><br/>${formatCurrency(currentMonth.income - currentMonth.expense)}</div>
      <div class="card"><strong>Mes anterior</strong><br/>${formatCurrency(previousMonth.income - previousMonth.expense)}</div>
      <div class="card"><strong>Mesmo mes (ano anterior)</strong><br/>${formatCurrency(sameMonthLastYear.income - sameMonthLastYear.expense)}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descricao</th>
          <th>Categoria</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Responsavel</th>
        </tr>
      </thead>
      <tbody>
        ${reportRows
          .map((item) => {
            const amount = Math.abs(Number(item.amount) || 0)
            return `<tr>
              <td>${formatDate(item.date || item.transaction_date || item.createdAt || item.created_at)}</td>
              <td>${item.description || '-'}</td>
              <td>${item.category || '-'}</td>
              <td>${item.type === 'income' ? 'Receita' : 'Despesa'}</td>
              <td>${formatCurrency(amount)}</td>
              <td>${item.owner || '-'}</td>
            </tr>`
          })
          .join('')}
      </tbody>
    </table>

    <script>
      window.onload = () => {
        window.print();
      };
    </script>
  </body>
</html>`

  const reportWindow = window.open('', '_blank', 'width=960,height=720')
  if (!reportWindow) return

  reportWindow.document.open()
  reportWindow.document.write(html)
  reportWindow.document.close()
}
