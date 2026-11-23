import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { monthlySeries } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const months = new URL(request.url).searchParams.get('months') || undefined
    return json(await monthlySeries(admin, groupId, months))
  })
}
