import { withAuth, json, readBody } from '../../../../src/lib/comprasRoute'
import { listTransactions, createTransaction } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const sp = new URL(request.url).searchParams
    const paidParam = sp.get('paid')
    return json(
      await listTransactions(admin, groupId, {
        month: sp.get('month') || undefined,
        type: sp.get('type') || undefined,
        category: sp.get('category') || undefined,
        paid: paidParam === null ? undefined : paidParam === 'true',
        q: sp.get('q') || undefined,
        limit: sp.get('limit') || undefined,
        offset: sp.get('offset') || undefined,
      }),
    )
  })
}

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const body = await readBody(request)
    return json(await createTransaction(admin, groupId, userId, body), 201)
  })
}
