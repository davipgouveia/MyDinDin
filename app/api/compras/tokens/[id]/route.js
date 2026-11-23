import { withSession, json } from '../../../../../src/lib/comprasRoute'
import { revokeApiToken } from '../../../../../src/lib/comprasServer'

export async function DELETE(request, { params }) {
  return withSession(request, async ({ admin, userId }) => {
    const { id } = await params
    await revokeApiToken(admin, userId, id)
    return json({ revoked: true })
  })
}
