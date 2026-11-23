import { withAuth, json, fail } from '../../../../../../src/lib/comprasRoute'
import { resolveProduct, resolveStore, productPrices } from '../../../../../../src/lib/comprasServer'

export async function GET(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { ref } = await params
    const product = await resolveProduct(admin, groupId, ref)
    if (!product) return fail('Produto não encontrado.', 404)
    const url = new URL(request.url)
    const result = await productPrices(admin, groupId, product.id)
    let history = result.history
    const since = url.searchParams.get('since')
    const until = url.searchParams.get('until')
    const storeRef = url.searchParams.get('store')
    if (since) history = history.filter((h) => h.date >= since)
    if (until) history = history.filter((h) => h.date <= until)
    if (storeRef) {
      const store = await resolveStore(admin, groupId, storeRef)
      history = history.filter((h) => h.store?.id === store?.id)
    }
    return json({ product, ...result, history })
  })
}
