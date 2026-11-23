import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { nameNorm } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const q = nameNorm(new URL(request.url).searchParams.get('q') || '')
    if (!q) return json({ products: [], stores: [] })
    const [{ data: products }, { data: stores }] = await Promise.all([
      admin.from('products').select('*').eq('group_id', groupId).ilike('name_norm', `%${q}%`).limit(20),
      admin.from('stores').select('*').eq('group_id', groupId).ilike('name_norm', `%${q}%`).limit(20),
    ])
    return json({ products: products || [], stores: stores || [] })
  })
}
