import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { comparePrices } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => json(await comparePrices(admin, groupId)))
}
