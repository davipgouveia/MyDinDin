import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { listPurchases, purchaseTotal } from '../../../../src/lib/comprasServer'
import { roundMoney } from '../../../../src/utils/format'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const url = new URL(request.url)
    const groupBy = url.searchParams.get('group_by') || 'month'
    const purchases = await listPurchases(admin, groupId, {
      limit: 5000,
      since: url.searchParams.get('since') || undefined,
      until: url.searchParams.get('until') || undefined,
    })
    const totals = new Map()
    if (groupBy !== 'category') {
      for (const purchase of purchases) {
        const key = groupBy === 'store' ? purchase.store?.name || 'Sem loja' : String(purchase.date).slice(0, 7)
        totals.set(key, roundMoney((totals.get(key) || 0) + purchaseTotal(purchase)))
      }
    } else {
      // Categoria e por produto: distribui o total entre as categorias
      // dos itens da compra.
      const { data: products } = await admin.from('products').select('id, category').eq('group_id', groupId)
      const categoryById = new Map((products || []).map((p) => [p.id, p.category || 'Sem categoria']))
      for (const purchase of purchases) {
        for (const item of purchase.items || []) {
          const key = categoryById.get(item.product_id) || 'Sem categoria'
          const value = item.total_price != null
            ? Number(item.total_price)
            : (Number(item.unit_price) || 0) * (Number(item.quantity) || 0)
          totals.set(key, roundMoney((totals.get(key) || 0) + value))
        }
      }
    }
    const rows = [...totals.entries()].map(([key, total]) => ({ key, total }))
    rows.sort((a, b) => (groupBy === 'month' ? a.key.localeCompare(b.key) : b.total - a.total))
    return json(rows)
  })
}
