import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { listBudgets } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const month = new URL(request.url).searchParams.get('month') || undefined
    return json(await listBudgets(admin, groupId, month))
  })
}
