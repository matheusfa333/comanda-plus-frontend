// Geração dos PDFs de relatório no navegador (jsPDF carregado só no clique: usa window)
import type { Reports, ClosedAccountsResult } from '@/lib/api/reports'
import { money, weight, CATEGORY_LABEL, PAYMENT_LABEL } from '@/lib/utils/format'

const BRAND: [number, number, number] = [196, 92, 42] // #c45c2a
const DARK: [number, number, number] = [42, 31, 20] // #2a1f14
const MUTED: [number, number, number] = [122, 102, 80] // #7a6650
const STRIPE: [number, number, number] = [250, 246, 239] // #faf6ef

// A fonte padrão do PDF não tem emoji: remove para não sair lixo no arquivo
const plain = (s: string) => s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g, ' ').trim()

const br = (iso: string) => iso.split('-').reverse().join('/')
const periodText = (from: string, to: string) => (from === to ? br(from) : `${br(from)} a ${br(to)}`)
const stamp = () =>
  new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const hm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dhm = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

async function load() {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  return { jsPDF, autoTable }
}

type Doc = InstanceType<Awaited<ReturnType<typeof load>>['jsPDF']>

function header(doc: Doc, title: string, from: string, to: string, by?: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...DARK)
  doc.rect(0, 0, w, 26, 'F')
  doc.setTextColor(250, 246, 239)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Quintal do Roger', 14, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Comanda+ · Sistema de Pedidos', 14, 17)
  doc.setFontSize(9)
  doc.text(`Gerado em ${stamp()}${by ? ` por ${by}` : ''}`, w - 14, 17, { align: 'right' })

  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(title, 14, 37)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(`Período: ${periodText(from, to)}`, 14, 43)
}

// Rodapé com número da página em todas as páginas
function footer(doc: Doc) {
  const pages = doc.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Considera apenas contas já fechadas.', 14, h - 8)
    doc.text(`Página ${i} de ${pages}`, w - 14, h - 8, { align: 'right' })
  }
}

const lastY = (doc: Doc) => ((doc as any).lastAutoTable?.finalY ?? 50) as number

// rows: linhas da tabela que vem embaixo, para não deixar a tabela partida (título + 1 linha sozinhos)
function section(doc: Doc, y: number, title: string, rows = 1): number {
  const needed = 14 + Math.min(rows, 12) * 7.5
  if (y + needed > doc.internal.pageSize.getHeight() - 18) {
    doc.addPage()
    y = 20
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...BRAND)
  doc.text(title, 14, y)
  return y + 3
}

const tableStyle = {
  theme: 'grid' as const,
  margin: { left: 14, right: 14, top: 16, bottom: 18 },
  styles: { fontSize: 9, cellPadding: 2, textColor: DARK, lineColor: [217, 207, 194] as [number, number, number], lineWidth: 0.2 },
  headStyles: { fillColor: BRAND, textColor: [255, 255, 255] as [number, number, number], fontStyle: 'bold' as const },
  alternateRowStyles: { fillColor: STRIPE },
}

// Relatório completo do período (todos os relatórios da aba em um PDF só)
export async function downloadReportsPdf(data: Reports, from: string, to: string, by?: string) {
  const { jsPDF, autoTable } = await load()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'Relatório de Vendas', from, to, by)

  const empty = (cols: number) => [[{ content: 'Sem vendas no período', colSpan: cols, styles: { halign: 'center' as const, textColor: MUTED } }]]
  const right = { halign: 'right' as const }

  let y = section(doc, 52, 'Faturamento')
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Contas fechadas', 'Vendas (sem taxa)', 'Taxa de serviço (10%)', 'Total recebido', 'Ticket médio']],
    body: [[
      String(data.revenue.accounts),
      money(data.revenue.subtotal),
      money(data.revenue.serviceFee),
      money(data.revenue.total),
      money(data.averageTicket),
    ]],
    bodyStyles: { fontStyle: 'bold' },
  })

  y = section(doc, lastY(doc) + 10, 'Formas de pagamento', data.byPayment.length)
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Forma', 'Pagamentos', 'Valor']],
    body: data.byPayment.length
      ? data.byPayment.map((m) => [PAYMENT_LABEL[m.method]?.label ?? m.method, String(m.count), money(m.amount)])
      : empty(3),
    columnStyles: { 1: right, 2: right },
  })

  y = section(doc, lastY(doc) + 10, 'Funcionários que mais venderam', data.topEmployees.length)
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['#', 'Funcionário', 'Pedidos', 'Vendido']],
    body: data.topEmployees.length
      ? data.topEmployees.map((e, i) => [String(i + 1), plain(e.name), String(e.orders), money(e.subtotal)])
      : empty(4),
    columnStyles: { 0: { cellWidth: 10 }, 2: right, 3: right },
  })

  y = section(doc, lastY(doc) + 10, 'Cervejas mais vendidas', data.topBeers.length)
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['#', 'Cerveja', 'Quantidade', 'Vendido']],
    body: data.topBeers.length
      ? data.topBeers.map((b, i) => [String(i + 1), plain(b.name), `${b.quantity} un`, money(b.subtotal)])
      : empty(4),
    columnStyles: { 0: { cellWidth: 10 }, 2: right, 3: right },
  })

  y = section(doc, lastY(doc) + 10, 'Carnes com mais saída', data.topMeats.length)
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['#', 'Carne', 'Peso', 'Vendido']],
    body: data.topMeats.length
      ? data.topMeats.map((m, i) => [String(i + 1), plain(m.name), weight(m.grams), money(m.subtotal)])
      : empty(4),
    columnStyles: { 0: { cellWidth: 10 }, 2: right, 3: right },
  })

  y = section(doc, lastY(doc) + 10, 'Vendas por categoria', data.byCategory.length)
  const catTotal = data.byCategory.reduce((s, c) => s + c.subtotal, 0)
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Categoria', '% das vendas', 'Vendido']],
    body: data.byCategory.length
      ? data.byCategory.map((c) => [
          plain(CATEGORY_LABEL[c.category] ?? c.category),
          catTotal ? `${((c.subtotal / catTotal) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '-',
          money(c.subtotal),
        ])
      : empty(3),
    columnStyles: { 1: right, 2: right },
  })

  footer(doc)
  doc.save(`relatorio-vendas_${from}${from === to ? '' : `_a_${to}`}.pdf`)
}

// Mesas fechadas do período, com os itens de cada conta
export async function downloadClosedAccountsPdf(result: ClosedAccountsResult, from: string, to: string, by?: string) {
  const { jsPDF, autoTable } = await load()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  header(doc, 'Mesas Fechadas', from, to, by)
  const right = { halign: 'right' as const }
  const multiDay = from !== to
  const s = result.summary

  let y = section(doc, 52, 'Resumo')
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    head: [['Contas fechadas', 'Vendas (sem taxa)', 'Taxa de serviço', 'Total recebido']],
    body: [[String(s.count), money(s.subtotal), money(s.serviceFee), money(s.total)]],
    bodyStyles: { fontStyle: 'bold' },
  })
  if (s.byPayment.length) {
    autoTable(doc, {
      ...tableStyle,
      startY: lastY(doc) + 4,
      head: [['Forma de pagamento', 'Pagamentos', 'Valor']],
      body: s.byPayment.map((m) => [PAYMENT_LABEL[m.method]?.label ?? m.method, String(m.count), money(m.amount)]),
      columnStyles: { 1: right, 2: right },
    })
  }

  y = section(doc, lastY(doc) + 10, 'Contas')
  if (result.accounts.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...MUTED)
    doc.text('Nenhuma mesa fechada no período.', 14, y + 5)
  }

  let first = true
  for (const a of result.accounts) {
    const opened = multiDay ? dhm(a.openedAt) : hm(a.openedAt)
    const closed = multiDay ? dhm(a.closedAt) : hm(a.closedAt)
    const pay = a.payments.length
      ? a.payments
          .map((p) => `${PAYMENT_LABEL[p.method]?.label ?? p.method}${p.method === 'CREDITO' && p.installments > 1 ? ` ${p.installments}x` : ''} ${money(p.amount)}`)
          .join(' + ')
      : 'não registrado'
    const items = a.orders.flatMap((o) =>
      o.items.map((it) => [
        hm(o.createdAt),
        plain(o.waiter),
        plain(it.productName) + (it.notes ? `\nObs: ${plain(it.notes)}` : ''),
        it.isMeat ? weight(it.quantity) : `${it.quantity} un`,
        money(it.subtotal),
      ]),
    )

    // Conta inteira na mesma página quando couber (cabeçalho + itens + 3 linhas de total)
    let startY = first ? y : lastY(doc) + 6
    const needed = (items.length + 5) * 7.6
    const pageH = doc.internal.pageSize.getHeight()
    if (startY + needed > pageH - 18 && needed < pageH - 40) {
      doc.addPage()
      startY = 16
    }

    autoTable(doc, {
      ...tableStyle,
      startY,
      head: [
        [{
          content: `Mesa ${plain(a.tableIdentifier)}${a.clientName ? ` · ${plain(a.clientName)}` : ''}  —  ${opened} às ${closed}  —  fechada por ${plain(a.closedBy)}${a.divergent ? '  —  DIVERGÊNCIA' : ''}`,
          colSpan: 5,
          styles: { fillColor: a.divergent ? [217, 83, 79] : DARK, halign: 'left' },
        }],
        ['Hora', 'Lançado por', 'Item', 'Qtd', 'Valor'],
      ],
      body: items,
      foot: [
        [{ content: 'Subtotal', colSpan: 4 }, { content: money(a.subtotal), styles: right }],
        [{ content: 'Taxa de serviço (10%)', colSpan: 4 }, { content: money(a.serviceFee), styles: right }],
        [{ content: `Total cobrado  ·  Pagamento: ${pay}`, colSpan: 4 }, { content: money(a.total), styles: right }],
      ],
      footStyles: { fillColor: STRIPE, textColor: DARK, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 30 }, 3: { ...right, cellWidth: 20 }, 4: { ...right, cellWidth: 26 } },
      showHead: 'everyPage',
      showFoot: 'lastPage',
      rowPageBreak: 'avoid',
    })
    first = false
  }

  footer(doc)
  doc.save(`mesas-fechadas_${from}${from === to ? '' : `_a_${to}`}.pdf`)
}
