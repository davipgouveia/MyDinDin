import { withAuth, json, fail, readBody } from '../../../../src/lib/comprasRoute'
import { findOrCreateProduct, loadForecast, computeForecast } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { products, purchasesByProduct, finishedByProduct } = await loadForecast(admin, groupId)
    const lastPurchase = new Map()
    for (const [productId, buys] of purchasesByProduct.entries()) {
      const sorted = [...buys].sort((a, b) => String(b.date).localeCompare(String(a.date)))
      if (sorted[0]) lastPurchase.set(productId, sorted[0].date)
    }
    return json(
      products.map((product) => ({
        ...product,
        last_purchase_date: lastPurchase.get(product.id) || null,
        forecast: computeForecast(product, purchasesByProduct.get(product.id) || [], finishedByProduct.get(product.id) || []),
      })),
    )
  })
}

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const body = await readBody(request)
    if (!body.name) return fail('Informe o nome do produto.')
    const product = await findOrCreateProduct(admin, groupId, userId, body.name, body)
    return json(product, 201)
  })
}
