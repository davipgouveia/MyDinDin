import { withAuth, json, fail, readBody } from '../../../../../src/lib/comprasRoute'
import { resolveProduct, nameNorm, loadForecast, computeForecast } from '../../../../../src/lib/comprasServer'

export async function GET(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const { purchasesByProduct, finishedByProduct } = await loadForecast(admin, groupId)
    return json({
      ...product,
      forecast: computeForecast(product, purchasesByProduct.get(product.id) || [], finishedByProduct.get(product.id) || []),
    })
  })
}

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const body = await readBody(request)
    const updates = {}
    if (body.name) { updates.name = String(body.name).trim(); updates.name_norm = nameNorm(body.name) }
    for (const key of ['category', 'unit', 'brand', 'notes', 'consumable', 'duration_days_override']) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    const { data, error } = await admin.from('products').update(updates).eq('id', product.id).select('*').single()
    if (error) return fail(error.message)
    return json(data)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const { error } = await admin.from('products').delete().eq('id', product.id)
    if (error) return fail(error.message)
    return json({ deleted: true })
  })
}
