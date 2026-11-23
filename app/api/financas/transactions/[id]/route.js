import { withAuth, json, fail, readBody } from '../../../../../src/lib/comprasRoute'
import { getTransaction, updateTransaction, deleteTransaction } from '../../../../../src/lib/financasServer'

export async function GET(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const tx = await getTransaction(admin, groupId, id)
    if (!tx) return fail('Lançamento não encontrado.', 404)
    return json(tx)
  })
}

export async function PATCH(request, { params }) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const { id } = await params
    const body = await readBody(request)
    const tx = await updateTransaction(admin, groupId, userId, id, body)
    if (!tx) return fail('Lançamento não encontrado.', 404)
    return json(tx)
  })
}

export async function DELETE(request, { params }) {
  return withAuth(request, async ({ admin, groupId }) => {
    const { id } = await params
    const ok = await deleteTransaction(admin, groupId, id)
    if (!ok) return fail('Lançamento não encontrado.', 404)
    return json({ deleted: true })
  })
}
