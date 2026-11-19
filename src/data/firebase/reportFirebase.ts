import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore'
import { z } from 'zod'
import type { ReportRow } from '../types'
import { parseDay } from './activityFirebase'
import { db } from './app'

const projectSchema = z.object({
  title: z.string().catch(''),
  projectValue: z.number().catch(0),
})

// Client payments have no expenseId. Payments with one are money paid out against that expense.
const paymentSchema = z.object({
  projectId: z.string(),
  amount: z.number().catch(0),
  date: z.string().optional().catch(undefined),
  expenseId: z.string().optional().catch(undefined),
})

const expenseSchema = z.object({
  projectId: z.string(),
  amount: z.number().catch(0),
  advancePaid: z.number().optional().catch(undefined),
  category: z.enum(['labour', 'material', 'rent', 'others']).catch('others'),
  title: z.string().optional().catch(undefined),
  vendorName: z.string().optional().catch(undefined),
  labourName: z.string().optional().catch(undefined),
  othersName: z.string().optional().catch(undefined),
  date: z.string().optional().catch(undefined),
})

function byUser(name: string, userId: string) {
  return query(collection(db, name), where('userId', '==', userId))
}

// Undated rows go last
function time(row: ReportRow) {
  return ('date' in row && row.date?.getTime()) || Number.MAX_SAFE_INTEGER
}

export async function countUserProjects(userId: string) {
  return (await getCountFromServer(byUser('projects', userId))).data().count
}

export async function getUserReport(userId: string): Promise<ReportRow[]> {
  const [projectDocs, expenseDocs, paymentDocs] = await Promise.all(
    ['projects', 'expenses', 'payments'].map((name) => getDocs(byUser(name, userId))),
  )

  const projects = Object.fromEntries(projectDocs.docs.map((d) => [d.id, projectSchema.parse(d.data())]))
  const payments = paymentDocs.docs.flatMap((d) => {
    const payment = paymentSchema.safeParse(d.data())
    return payment.success ? [payment.data] : []
  })
  const projectFields = (projectId: string) => ({
    projectId,
    projectName: projects[projectId].title,
    quotationValue: projects[projectId].projectValue,
  })

  const rows: ReportRow[] = payments
    .filter((payment) => !payment.expenseId && projects[payment.projectId])
    .map((payment) => ({
      ...projectFields(payment.projectId),
      kind: 'income',
      date: parseDay(payment.date),
      amount: payment.amount,
    }))

  for (const expenseDoc of expenseDocs.docs) {
    const parsed = expenseSchema.safeParse(expenseDoc.data())
    if (!parsed.success || !projects[parsed.data.projectId]) continue
    const expense = parsed.data

    const linked = payments.filter((payment) => payment.expenseId === expenseDoc.id)
    const paidFromPayments = linked.reduce((sum, payment) => sum + payment.amount, 0)
    // Same rule as getExpensePaid in the app (lib/project-metrics.ts), so the report matches what the user sees
    const paid = paidFromPayments > 0 ? paidFromPayments : expense.advancePaid || 0
    const date = parseDay(expense.date)
    const latestPayment = Math.max(0, ...linked.map((payment) => parseDay(payment.date)?.getTime() ?? 0))
    const payee =
      expense.category === 'material'
        ? expense.vendorName
        : expense.category === 'labour'
          ? expense.labourName
          : expense.othersName

    rows.push({
      ...projectFields(expense.projectId),
      kind: 'expense',
      date,
      category: expense.category,
      payee: payee || expense.title || '',
      amount: expense.amount,
      paid,
      paidDate: paidFromPayments > 0 ? (latestPayment ? new Date(latestPayment) : null) : paid > 0 ? date : null,
      toPay: Math.max(0, expense.amount - paid),
    })
  }

  for (const projectId of Object.keys(projects)) {
    if (!rows.some((row) => row.projectId === projectId)) rows.push({ ...projectFields(projectId), kind: 'project' })
  }

  // Project IDs keep two projects with the same name apart
  return rows.sort(
    (a, b) =>
      a.projectName.localeCompare(b.projectName) || a.projectId.localeCompare(b.projectId) || time(a) - time(b),
  )
}
