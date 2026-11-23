import { withAuth, json, fail, readBody } from '../../../../../src/lib/comprasRoute'

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const body = await readBody(request)
    const updates = {}
    for (const key of ['name', 'quantity', 'notes', 'done']) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    if (updates.done === true) updates.done_at = new Date().toISOString()
    if (updates.done === false) updates.done_at = null
    const { data, error } = await admin
      .from('shopping_list')
      .update(updates)
      .eq('id', id)
      .eq('group_id', groupId)
      .select('*, product:products(id, name, unit, consumable)')
      .single()
    if (error) return fail(error.message)
    return json(data)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const { error } = await admin.from('shopping_list').delete().eq('id', id).eq('group_id', groupId)
    if (error) return fail(error.message)
    return json({ deleted: true })
  })
}
