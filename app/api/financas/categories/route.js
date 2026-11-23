import { withAuth, json, readBody } from '../../../../src/lib/comprasRoute'
import { categoriesWithTotals, createCategory } from '../../../../src/lib/financasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const month = new URL(request.url).searchParams.get('month') || undefined
    return json(await categoriesWithTotals(admin, groupId, month))
  })
}

export async function POST(request) {
  return withAuth(request, async ({ admin, groupId, userId }) => {
    const body = await readBody(request)
    return json(await createCategory(admin, groupId, userId, body), 201)
  })
}
