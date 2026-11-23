import { withAuth, json, fail, readBody } from '../../../../../src/lib/comprasRoute'
import { getPurchase, purchaseTotal, findOrCreateStore } from '../../../../../src/lib/comprasServer'

export async function GET(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const purchase = await getPurchase(admin, groupId, id)
    if (!purchase) return fail('Compra não encontrada.', 404)
    return json({ ...purchase, total: purchaseTotal(purchase) })
  })
}

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const { id } = await params
    const purchase = await getPurchase(admin, groupId, id)
    if (!purchase) return fail('Compra não encontrada.', 404)
    const body = await readBody(request)
    const updates = {}
    if (body.date) updates.date = body.date
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.store !== undefined) {
      updates.store_id = body.store
        ? (await findOrCreateStore(admin, groupId, userId, body.store, body.store_kind)).id
        : null
    }
    const { data, error } = await admin.from('purchases').update(updates).eq('id', id).select('*').single()
    if (error) return fail(error.message)
    return json(data)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const purchase = await getPurchase(admin, groupId, id)
    if (!purchase) return fail('Compra não encontrada.', 404)
    const { error } = await admin.from('purchases').delete().eq('id', id).eq('group_id', groupId)
    if (error) return fail(error.message)
    if (purchase.transaction_id) {
      await admin.from('transactions').delete().eq('id', purchase.transaction_id)
    }
    return json({ deleted: true })
  })
}
