import type { ReportRow } from '../../data/types'
import { dayKey, formatDate, fromDayKey } from './istFormat'

const DAY = 24 * 60 * 60 * 1000

// Till-date totals for one project, plus the last 7 days for the weekly message
export type ProjectSummary = {
  name: string
  quotation: number
  received: number
  spent: number
  paid: number
  toPay: number
  // received − paid
  cash: number
  receivedLast7: number
  paidLast7: number
  // Client payments plus expenses
  entries: number
}

// "₹2,50,000", "-₹64,450"
export function formatMoney(amount: number) {
  return `${amount < 0 ? '-' : ''}₹${Math.round(Math.abs(amount)).toLocaleString('en-IN')}`
}

// Midnight IST of today
export function istToday() {
  return fromDayKey(dayKey(new Date()))
}

// One per project, in the rows' order. `today` is midnight IST of the download day; the last 7 days are
// today and the 6 days before, by each payment's own date.
export function summarize(rows: ReportRow[], today: Date): ProjectSummary[] {
  const inLast7 = (date: Date | null) =>
    !!date && date.getTime() > today.getTime() - 7 * DAY && date.getTime() <= today.getTime()
  const projects: Record<string, ProjectSummary> = {}

  for (const row of rows) {
    const project = (projects[row.projectId] ??= {
      name: row.projectName,
      quotation: row.quotationValue,
      received: 0,
      spent: 0,
      paid: 0,
      toPay: 0,
      cash: 0,
      receivedLast7: 0,
      paidLast7: 0,
      entries: 0,
    })
    if (row.kind === 'income') {
      project.received += row.amount
      if (inLast7(row.date)) project.receivedLast7 += row.amount
      project.entries++
    }
    if (row.kind === 'expense') {
      project.spent += row.amount
      project.paid += row.paid
      project.toPay += row.toPay
      project.paidLast7 += row.payouts.reduce((sum, p) => sum + (inLast7(p.date) ? p.amount : 0), 0)
      project.entries++
    }
    project.cash = project.received - project.paid
  }

  return Object.values(projects)
}

// Short text version of the Summary sheet, for pasting into WhatsApp (*bold*)
export function whatsappMessage(projects: ProjectSummary[], today: Date) {
  const last7 = (amount: number) => (amount > 0 ? ` (last 7 days ${formatMoney(amount)})` : '')
  return [
    `*Smart Hisab hisaab*\nTill ${formatDate(today)}`,
    ...projects.map((p) =>
      p.entries === 0
        ? `*${p.name}*\nNo entries yet`
        : [
            `*${p.name}*`,
            `Received from client: ${formatMoney(p.received)}${last7(p.receivedLast7)}`,
            `Paid out: ${formatMoney(p.paid)}${last7(p.paidLast7)}`,
            `Still to pay: ${formatMoney(p.toPay)}`,
            `Cash in hand: ${formatMoney(p.cash)}`,
          ].join('\n'),
    ),
  ].join('\n\n')
}
