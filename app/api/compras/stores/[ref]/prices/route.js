import { withAuth, json, fail } from '../../../../../../src/lib/comprasRoute'
import { resolveStore, listPurchases, itemTotal } from '../../../../../../src/lib/comprasServer'

export async function GET(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const store = await resolveStore(admin, groupId, ref)
    if (!store) return fail('Loja não encontrada.', 404)
    const purchases = await listPurchases(admin, groupId, { limit: 500, storeId: store.id })
    const prices = []
    for (const purchase of purchases) {
      for (const item of purchase.items || []) {
        if (item.unit_price == null) continue
        prices.push({
          product: item.product || { id: item.product_id },
          date: purchase.date,
          unit_price: Number(item.unit_price),
          total: itemTotal(item),
        })
      }
    }
    return json({ store, prices })
  })
}
