import { withAuth, json, fail, readBody } from '../../../../../../src/lib/comprasRoute'
import { getPurchase, findOrCreateProduct } from '../../../../../../src/lib/comprasServer'
import { roundMoney } from '../../../../../../src/utils/format'

export async function POST(request, { params }) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const { id } = await params
    const purchase = await getPurchase(admin, groupId, id)
    if (!purchase) return fail('Compra não encontrada.', 404)
    const body = await readBody(request)
    if (!body.product) return fail('Informe o produto do item.')
    const product = await findOrCreateProduct(admin, groupId, userId, body.product, body)
    const quantity = Number(body.quantity) || 1
    let unitPrice = body.unit_price != null ? roundMoney(Number(body.unit_price)) : null
    let totalPrice = body.total_price != null ? roundMoney(Number(body.total_price)) : null
    if (unitPrice == null && totalPrice != null && quantity > 0) unitPrice = roundMoney(totalPrice / quantity)
    if (totalPrice == null && unitPrice != null) totalPrice = roundMoney(unitPrice * quantity)
    const { data, error } = await admin
      .from('purchase_items')
      .insert({ group_id: groupId, purchase_id: id, product_id: product.id, quantity, unit_price: unitPrice, total_price: totalPrice })
      .select('*')
      .single()
    if (error) return fail(error.message)
    return json(data, 201)
  })
}
