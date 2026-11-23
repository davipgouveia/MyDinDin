import { withAuth, json, fail, readBody } from '../../../../../../src/lib/comprasRoute'
import { resolveProduct } from '../../../../../../src/lib/comprasServer'

export async function POST(request, { params }) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const body = await readBody(request)
    const { data, error } = await admin
      .from('finished_events')
      .insert({
        group_id: groupId,
        product_id: product.id,
        date: body.date || new Date().toISOString().slice(0, 10),
        created_by: userId,
      })
      .select('*')
      .single()
    if (error) return fail(error.message)
    return json(data, 201)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const { data } = await admin
      .from('finished_events')
      .select('id')
      .eq('group_id', groupId)
      .eq('product_id', product.id)
      .order('date', { ascending: false })
      .limit(1)
    if (data?.[0]) await admin.from('finished_events').delete().eq('id', data[0].id)
    return json({ deleted: Boolean(data?.[0]) })
  })
}
