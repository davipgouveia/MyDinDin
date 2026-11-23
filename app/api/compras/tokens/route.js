import { withSession, json, fail, readBody } from '../../../../src/lib/comprasRoute'
import { createApiToken, listApiTokens } from '../../../../src/lib/comprasServer'

// Gestao dos tokens pessoais de API — somente com a sessao do app
// (um token nao pode criar outros tokens).
export async function GET(request) {
  return withSession(request, async ({ admin, userId }) => json(await listApiTokens(admin, userId)))
}

export async function POST(request) {
  return withSession(request, async ({ admin, userId, groupId }) => {
    const body = await readBody(request)
    const created = await createApiToken(admin, { userId, groupId, name: body.name })
    return json(created, 201)
  })
}
