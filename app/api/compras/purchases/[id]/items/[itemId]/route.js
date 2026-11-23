import { withAuth, json, fail, readBody } from '../../../../../../../src/lib/comprasRoute'
import { roundMoney } from '../../../../../../../src/utils/format'

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id, itemId } = await params
    const body = await readBody(request)
    const updates = {}
    if (body.quantity != null) updates.quantity = Number(body.quantity)
    if (body.unit_price !== undefined) updates.unit_price = body.unit_price != null ? roundMoney(Number(body.unit_price)) : null
    if (body.total_price !== undefined) updates.total_price = body.total_price != null ? roundMoney(Number(body.total_price)) : null
    if (updates.quantity != null && updates.unit_price != null && body.total_price === undefined) {
      updates.total_price = roundMoney(updates.quantity * updates.unit_price)
    }
    const { data, error } = await admin
      .from('purchase_items')
      .update(updates)
      .eq('id', itemId)
      .eq('purchase_id', id)
      .eq('group_id', groupId)
      .select('*')
      .single()
    if (error) return fail(error.message)
    return json(data)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id, itemId } = await params
    const { error } = await admin
      .from('purchase_items')
      .delete()
      .eq('id', itemId)
      .eq('purchase_id', id)
      .eq('group_id', groupId)
    if (error) return fail(error.message)
    return json({ deleted: true })
  })
}
