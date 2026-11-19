import type { ExpenseCategory, ReportRow } from '../../data/types'

const IST_OFFSET = 5.5 * 60 * 60 * 1000

// ₹ with Indian grouping: ₹2,50,000 and ₹1,25,00,000
const RUPEES = '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"##,##0'
const DAY = 'd mmm yyyy'

const CATEGORIES: Record<ExpenseCategory, string> = {
  labour: 'Labour',
  material: 'Material',
  rent: 'Rent',
  others: 'Others',
}

const COLUMNS = [
  { header: 'User Name', key: 'user', width: 20 },
  { header: 'Project Name', key: 'project', width: 24 },
  { header: 'Quotation Value', key: 'quotation', width: 16, style: { numFmt: RUPEES } },
  { header: 'Income received Amount', key: 'income', width: 16, style: { numFmt: RUPEES } },
  { header: 'Income received Date', key: 'incomeDate', width: 14, style: { numFmt: DAY } },
  { header: 'Expense Category', key: 'category', width: 12 },
  { header: 'Vendor / Labour name', key: 'payee', width: 22 },
  { header: 'Expense Amount', key: 'expense', width: 16, style: { numFmt: RUPEES } },
  { header: 'Expense Amount paid', key: 'paid', width: 16, style: { numFmt: RUPEES } },
  { header: 'Expense Amount paid date', key: 'paidDate', width: 14, style: { numFmt: DAY } },
  { header: 'Expense Amount to be paid', key: 'toPay', width: 16, style: { numFmt: RUPEES } },
]

// Excel dates have no time zone, so move midnight IST to midnight UTC of the same day
function excelDay(date: Date | null) {
  return date ? new Date(date.getTime() + IST_OFFSET) : undefined
}

function cells(row: ReportRow) {
  if (row.kind === 'income') return { income: row.amount, incomeDate: excelDay(row.date) }
  if (row.kind === 'expense') {
    return {
      category: CATEGORIES[row.category],
      payee: row.payee,
      expense: row.amount,
      paid: row.paid,
      paidDate: excelDay(row.paidDate),
      toPay: row.toPay,
    }
  }
  return {}
}

// Builds the .xlsx in the browser and saves it as SmartHisab_<name>_<YYYY-MM-DD>.xlsx.
// exceljs is large, so it's loaded only when someone downloads.
export async function downloadReport(userName: string, rows: ReportRow[]) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Report', { views: [{ state: 'frozen', ySplit: 1 }] })

  sheet.columns = COLUMNS
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: 'middle', wrapText: true }
  sheet.autoFilter = { from: 'A1', to: 'K1' }
  for (const row of rows) {
    sheet.addRow({ user: userName, project: row.projectName, quotation: row.quotationValue, ...cells(row) })
  }

  const blob = new Blob([await workbook.xlsx.writeBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  // en-CA formats as YYYY-MM-DD. Characters Windows doesn't allow in file names are dropped.
  link.download = `SmartHisab_${userName.replace(/[\\/:*?"<>|]/g, '')}_${new Date().toLocaleDateString('en-CA')}.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
