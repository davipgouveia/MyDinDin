import { withAuth, json, fail, readBody } from '../../../../src/lib/comprasRoute'
import { findOrCreateProduct } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const includeDone = new URL(request.url).searchParams.get('include_done') === 'true'
    let query = admin
      .from('shopping_list')
      .select('*, product:products(id, name, unit, consumable)')
      .eq('group_id', groupId)
      .order('done', { ascending: true })
      .order('created_at', { ascending: true })
    if (!includeDone) query = query.eq('done', false)
    const { data, error } = await query
    if (error) return fail(error.message)
    return json(data || [])
  })
}

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const body = await readBody(request)
    const name = body.name || body.product
    if (!name) return fail('Informe o nome do item.')
    let productId = null
    if (body.product || body.link_product) {
      productId = (await findOrCreateProduct(admin, groupId, userId, name)).id
    }
    const { data, error } = await admin
      .from('shopping_list')
      .insert({
        group_id: groupId,
        product_id: productId,
        name: String(name).trim(),
        quantity: Number(body.quantity) || 1,
        notes: body.notes || null,
        created_by: userId,
      })
      .select('*, product:products(id, name, unit, consumable)')
      .single()
    if (error) return fail(error.message)
    return json(data, 201)
  })
}

export async function DELETE(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const onlyDone = new URL(request.url).searchParams.get('only_done') === 'true'
    let query = admin.from('shopping_list').delete().eq('group_id', groupId)
    if (onlyDone) query = query.eq('done', true)
    const { error } = await query
    if (error) return fail(error.message)
    return json({ deleted: true })
  })
}
