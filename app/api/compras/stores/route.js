import { withAuth, json, fail, readBody } from '../../../../src/lib/comprasRoute'
import { findOrCreateStore } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { data, error } = await admin.from('stores').select('*').eq('group_id', groupId).order('name')
    if (error) return fail(error.message)
    return json(data || [])
  })
}

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const body = await readBody(request)
    if (!body.name) return fail('Informe o nome da loja.')
    const store = await findOrCreateStore(admin, groupId, userId, body.name, body.kind)
    if (body.notes !== undefined) {
      await admin.from('stores').update({ notes: body.notes }).eq('id', store.id)
      store.notes = body.notes
    }
    return json(store, 201)
  })
}
