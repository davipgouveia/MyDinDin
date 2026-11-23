import { withAuth, json, fail, readBody } from '../../../../../src/lib/comprasRoute'
import { resolveStore, nameNorm } from '../../../../../src/lib/comprasServer'

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const store = await resolveStore(admin, groupId, ref)
    if (!store) return fail('Loja não encontrada.', 404)
    const body = await readBody(request)
    const updates = {}
    if (body.name) { updates.name = String(body.name).trim(); updates.name_norm = nameNorm(body.name) }
    if (body.kind !== undefined) updates.kind = body.kind
    if (body.notes !== undefined) updates.notes = body.notes
    const { data, error } = await admin.from('stores').update(updates).eq('id', store.id).select('*').single()
    if (error) return fail(error.message)
    return json(data)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const store = await resolveStore(admin, groupId, ref)
    if (!store) return fail('Loja não encontrada.', 404)
    const { error } = await admin.from('stores').delete().eq('id', store.id)
    if (error) return fail(error.message)
    return json({ deleted: true })
  })
}
