import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { listTransactions } from '../../../../src/lib/financasServer'

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
