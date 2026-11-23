import { withAuth, json, fail, readBody } from '../../../../src/lib/comprasRoute'
import { listPurchases, createPurchase, purchaseTotal } from '../../../../src/lib/comprasServer'
import { resolveProduct, resolveStore } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const url = new URL(request.url)
    const limit = Math.min(5000, Number(url.searchParams.get('limit')) || 100)
    let productId
    let storeId
    if (url.searchParams.get('product')) {
      productId = (await resolveProduct(admin, groupId, url.searchParams.get('product')))?.id
    }
    if (url.searchParams.get('store')) {
      storeId = (await resolveStore(admin, groupId, url.searchParams.get('store')))?.id
    }
    const purchases = await listPurchases(admin, groupId, {
      limit,
      since: url.searchParams.get('since') || undefined,
      until: url.searchParams.get('until') || undefined,
      productId,
      storeId,
    })
    return json(purchases.map((p) => ({ ...p, total: purchaseTotal(p) })))
  })
}

export async function POST(request) {
  return withAuth(request, async (auth) => {
    const body = await readBody(request)
    if (!Array.isArray(body.items) || body.items.length === 0) return fail('A compra precisa de itens.')
    const purchase = await createPurchase(auth.admin, auth, body)
    return json({ ...purchase, total: purchaseTotal(purchase) }, 201)
  })
}
