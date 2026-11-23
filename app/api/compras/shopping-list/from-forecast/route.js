import { withAuth, json } from '../../../../../src/lib/comprasRoute'
import { getForecast, findOrCreateProduct, nameNorm } from '../../../../../src/lib/comprasServer'

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const withinDays = Number(new URL(request.url).searchParams.get('within_days')) || 7
    const forecasts = await getForecast(admin, groupId)
    const { data: pending } = await admin
      .from('shopping_list')
      .select('product_id, name')
      .eq('group_id', groupId)
      .eq('done', false)
    const pendingProducts = new Set((pending || []).map((i) => i.product_id).filter(Boolean))
    const pendingNames = new Set((pending || []).map((i) => nameNorm(i.name)))
    let added = 0
    for (const { product, forecast } of forecasts) {
      if (forecast.status === 'sem_dados') continue
      if (forecast.days_left != null && forecast.days_left > withinDays) continue
      if (pendingProducts.has(product.id) || pendingNames.has(nameNorm(product.name))) continue
      const productRow = await findOrCreateProduct(admin, groupId, userId, product.name)
      const { error } = await admin.from('shopping_list').insert({
        group_id: groupId,
        product_id: productRow.id,
        name: product.name,
        quantity: 1,
        created_by: userId,
      })
      if (!error) added += 1
    }
    return json({ added })
  })
}
