import { withAuth, json, fail } from '../../../../../src/lib/comprasRoute'
import { deleteBudget } from '../../../../../src/lib/financasServer'

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const ok = await deleteBudget(admin, groupId, id)
    if (!ok) return fail('Orçamento não encontrado.', 404)
    return json({ deleted: true })
  })
}
