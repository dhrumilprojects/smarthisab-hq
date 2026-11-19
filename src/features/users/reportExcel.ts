import type { Worksheet } from 'exceljs'
import type { ExpenseCategory, ReportRow } from '../../data/types'
import { dayKey, formatDate } from './istFormat'
import { istToday, summarize } from './reportSummary'

const IST_OFFSET = 5.5 * 60 * 60 * 1000
const DAY = 24 * 60 * 60 * 1000

// ₹ with Indian grouping: ₹2,50,000 and ₹1,25,00,000. It has no room for a minus sign,
// so negative values get NEGATIVE_RUPEES instead.
const RUPEES = '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"##,##0'
const NEGATIVE_RUPEES = '[<=-10000000]"-₹"##\\,##\\,##\\,##0;[<=-100000]"-₹"##\\,##\\,##0;"-₹"##,##0'
const DATE = 'd mmm yyyy'

const RED = { argb: 'FFC62828' }
const GREEN = { argb: 'FF2E7D32' }
const solid = (argb: string) => ({ type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb } })

const CATEGORIES: Record<ExpenseCategory, string> = {
  labour: 'Labour',
  material: 'Material',
  rent: 'Rent',
  others: 'Others',
}

// Excel dates have no time zone, so move midnight IST to midnight UTC of the same day
function excelDay(date: Date | null) {
  return date ? new Date(date.getTime() + IST_OFFSET) : undefined
}

// The IST day as an Excel DATE(…) for formulas
function excelDate(date: Date) {
  const [year, month, day] = dayKey(date).split('-').map(Number)
  return `DATE(${year},${month},${day})`
}

function headerRow(sheet: Worksheet, rowNumber: number, headers: string[]) {
  const row = sheet.getRow(rowNumber)
  row.values = headers
  row.font = { bold: true }
  row.alignment = { vertical: 'middle', wrapText: true }
  row.eachCell((cell) => (cell.fill = solid('FFF1F3F4')))
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

// Builds the .xlsx in the browser and saves it as SmartHisab_<name>_<YYYY-MM-DD>.xlsx.
// Everything is till date. exceljs is large, so it's loaded only when someone downloads.
export async function downloadReport(userName: string, rows: ReportRow[]) {
  const { default: ExcelJS } = await import('exceljs')
  const today = istToday()
  const projects = summarize(rows, today)
  const expenses = rows.flatMap((row) => (row.kind === 'expense' ? [row] : []))
  const income = rows.flatMap((row) => (row.kind === 'income' ? [row] : []))

  const workbook = new ExcelJS.Workbook()
  // Cached results are filled in for previews; Excel recalculates on open
  workbook.calcProperties.fullCalcOnLoad = true
  const sheetOptions = (frozenRows: number) => ({
    views: [{ state: 'frozen' as const, ySplit: frozenRows }],
    pageSetup: { orientation: 'landscape' as const, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  const summarySheet = workbook.addWorksheet('Summary', sheetOptions(5))
  const expenseSheet = workbook.addWorksheet('Expenses', sheetOptions(1))
  const incomeSheet = workbook.addWorksheet('Income', sheetOptions(1))

  // Expenses. Data is in rows 2…expLast; with no expenses a message fills row 2 so formula ranges stay valid.
  const expLast = Math.max(2, expenses.length + 1)
  expenseSheet.columns = [
    { width: 24 },
    { width: 13, style: { numFmt: DATE } },
    { width: 11 },
    { width: 22 },
    { width: 15, style: { numFmt: RUPEES } },
    { width: 15, style: { numFmt: RUPEES } },
    { width: 13, style: { numFmt: DATE } },
    { width: 15, style: { numFmt: RUPEES } },
    { width: 11 },
    { width: 19 },
  ]
  headerRow(expenseSheet, 1, [
    'Project',
    'Expense date',
    'Category',
    'Vendor / Labour',
    'Expense amount',
    'Paid',
    'Last paid on',
    'To be paid',
    'Status',
    'Check',
  ])
  const expCol = (col: string) => `$${col}$2:$${col}$${expLast}`
  expenses.forEach((expense, i) => {
    const r = i + 2
    // Same test as the COUNTIFS below, which can't match blank cells
    const duplicate =
      !!expense.date &&
      !!expense.payee &&
      expenses.some(
        (other) =>
          other !== expense &&
          other.projectName === expense.projectName &&
          other.payee === expense.payee &&
          other.amount === expense.amount &&
          other.date?.getTime() === expense.date?.getTime(),
      )
    expenseSheet.addRow([
      expense.projectName,
      excelDay(expense.date),
      CATEGORIES[expense.category],
      expense.payee || undefined,
      expense.amount,
      expense.paid,
      excelDay(expense.paidDate),
      { formula: `MAX(0,E${r}-F${r})`, result: expense.toPay },
      {
        formula: `IF(H${r}<=0,"Paid",IF(F${r}>0,"Part paid","Unpaid"))`,
        result: expense.toPay <= 0 ? 'Paid' : expense.paid > 0 ? 'Part paid' : 'Unpaid',
      },
      {
        formula: `IF(COUNTIFS(${expCol('A')},A${r},${expCol('D')},D${r},${expCol('E')},E${r},${expCol('B')},B${r})>1,"Possible duplicate","")`,
        result: duplicate ? 'Possible duplicate' : '',
      },
    ])
  })
  if (!expenses.length) expenseSheet.addRow(['No expenses recorded yet'])
  // SUBTOTAL(109, …) only adds the rows a filter shows
  const expTotal = expenseSheet.addRow([
    'Total',
    undefined,
    undefined,
    undefined,
    { formula: `SUBTOTAL(109,E2:E${expLast})`, result: sum(expenses.map((e) => e.amount)) },
    { formula: `SUBTOTAL(109,F2:F${expLast})`, result: sum(expenses.map((e) => e.paid)) },
    undefined,
    { formula: `SUBTOTAL(109,H2:H${expLast})`, result: sum(expenses.map((e) => e.toPay)) },
  ])
  expTotal.font = { bold: true }
  expenseSheet.autoFilter = `A1:J${expLast}`
  expenseSheet.addConditionalFormatting({
    ref: `I2:I${expLast}`,
    rules: [{ type: 'expression', priority: 1, formulae: ['AND($I2<>"",$I2<>"Paid")'], style: { font: { color: RED } } }],
  })
  expenseSheet.addConditionalFormatting({
    ref: `J2:J${expLast}`,
    rules: [
      {
        type: 'expression',
        priority: 2,
        formulae: ['$J2<>""'],
        style: { font: { color: { argb: 'FF8A5300' } }, fill: solid('FFFFF4CE') },
      },
    ],
  })

  // Income, laid out the same way
  const incLast = Math.max(2, income.length + 1)
  incomeSheet.columns = [{ width: 24 }, { width: 17, style: { numFmt: RUPEES } }, { width: 14, style: { numFmt: DATE } }]
  headerRow(incomeSheet, 1, ['Project', 'Amount received', 'Received on'])
  for (const payment of income) incomeSheet.addRow([payment.projectName, payment.amount, excelDay(payment.date)])
  if (!income.length) incomeSheet.addRow(['No client payments recorded yet'])
  incomeSheet.addRow([
    'Total',
    { formula: `SUBTOTAL(109,B2:B${incLast})`, result: sum(income.map((p) => p.amount)) },
  ]).font = { bold: true }
  incomeSheet.autoFilter = `A1:C${incLast}`
  const incCol = (col: string) => `Income!$${col}$2:$${col}$${incLast}`

  // Summary: one row per project, totals as formulas over the other two sheets
  summarySheet.columns = [{ width: 26 }, ...Array.from({ length: 8 }, () => ({ width: 15, style: { numFmt: RUPEES } }))]
  summarySheet.getCell('A1').value = `Smart Hisab report: ${userName}`
  summarySheet.getCell('A1').font = { bold: true, size: 14 }
  summarySheet.getCell('A2').value = `All entries till ${formatDate(today)}`
  summarySheet.getCell('A2').font = { color: { argb: 'FF5F6368' } }
  summarySheet.mergeCells('B4:G4')
  summarySheet.mergeCells('H4:I4')
  summarySheet.getCell('B4').value = 'Till date'
  summarySheet.getCell('H4').value = 'Last 7 days'
  for (const ref of ['B4', 'H4']) {
    const cell = summarySheet.getCell(ref)
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center' }
    cell.fill = solid(ref === 'B4' ? 'FFE8F0FE' : 'FFFEF7E0')
  }
  headerRow(summarySheet, 5, [
    'Project',
    'Quotation',
    'Received from client',
    'Spent (all expenses)',
    'Paid out',
    'Still to pay',
    'Cash in hand',
    'Received in last 7 days',
    'Paid out in last 7 days',
  ])

  const weekStart = new Date(today.getTime() - 6 * DAY)
  const expSum = (col: string, r: number) => `SUMIFS(Expenses!${expCol(col)},Expenses!${expCol('A')},$A${r})`
  projects.forEach((project, i) => {
    const r = i + 6
    summarySheet.addRow([
      project.name,
      project.quotation,
      { formula: `SUMIFS(${incCol('B')},${incCol('A')},$A${r})`, result: project.received },
      { formula: expSum('E', r), result: project.spent },
      { formula: expSum('F', r), result: project.paid },
      { formula: expSum('H', r), result: project.toPay },
      { formula: `C${r}-E${r}`, result: project.cash },
      {
        formula: `SUMIFS(${incCol('B')},${incCol('A')},$A${r},${incCol('C')},">="&${excelDate(weekStart)},${incCol('C')},"<="&${excelDate(today)})`,
        result: project.receivedLast7,
      },
      // A plain value: payments against expenses aren't on any sheet, only their totals are
      project.paidLast7,
    ])
  })
  const lastProject = projects.length + 5
  const totals = summarySheet.addRow([
    'All projects',
    ...(['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const).map((col, i) => ({
      formula: `SUM(${col}6:${col}${lastProject})`,
      result: sum(
        projects.map(
          (p) => [p.quotation, p.received, p.spent, p.paid, p.toPay, p.cash, p.receivedLast7, p.paidLast7][i],
        ),
      ),
    })),
  ])
  totals.font = { bold: true }
  totals.eachCell((cell) => (cell.border = { top: { style: 'thin' } }))
  summarySheet.autoFilter = `A5:I${lastProject}`

  // Cash in hand: red with a minus sign below 0, green above. Google Sheets ignores number formats in
  // conditional formatting, so each cell also starts with the format for its own sign.
  for (let r = 6; r <= totals.number; r++) {
    const cell = summarySheet.getCell(`G${r}`)
    cell.numFmt = ((cell.result as number) ?? 0) < 0 ? NEGATIVE_RUPEES : RUPEES
  }
  summarySheet.addConditionalFormatting({
    ref: `G6:G${totals.number}`,
    rules: [
      {
        type: 'cellIs',
        operator: 'lessThan',
        priority: 1,
        formulae: [0],
        style: { font: { color: RED, bold: true }, fill: solid('FFFDECEA'), numFmt: NEGATIVE_RUPEES },
      },
      {
        type: 'cellIs',
        operator: 'greaterThan',
        priority: 2,
        formulae: [0],
        style: { font: { color: GREEN, bold: true }, numFmt: RUPEES },
      },
    ],
  })

  const notes = [
    'Cash in hand = Received from client − Paid out. Red means more has been paid out than received.',
    'Paid = payments recorded against an expense, or its advance if no payments are recorded yet (same as the app).',
    `Last 7 days = ${formatDate(weekStart)} to ${formatDate(today)}, by each payment's own date. An advance counts on the expense's date.`,
  ]
  notes.forEach((note, i) => {
    const cell = summarySheet.getCell(`A${totals.number + 2 + i}`)
    cell.value = note
    cell.font = { italic: true, color: { argb: 'FF5F6368' } }
  })

  for (const sheet of [summarySheet, expenseSheet, incomeSheet]) {
    sheet.eachRow((row) => row.eachCell((cell) => (cell.font = { size: 10, ...cell.font, name: 'Arial' })))
  }

  const blob = new Blob([await workbook.xlsx.writeBuffer()], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  // Characters Windows doesn't allow in file names are dropped
  link.download = `SmartHisab_${userName.replace(/[\\/:*?"<>|]/g, '')}_${dayKey(today)}.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
