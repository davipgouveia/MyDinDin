import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { groupInfo } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => json(await groupInfo(admin, groupId)))
}
