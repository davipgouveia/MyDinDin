import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { listBills } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => json(await listBills(admin, groupId)))
}
