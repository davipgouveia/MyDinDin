import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { getForecast, listPurchases, purchaseTotal } from '../../../../src/lib/comprasServer'
import { roundMoney } from '../../../../src/utils/format'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const [{ data: pending }, forecasts, monthPurchases] = await Promise.all([
      admin.from('shopping_list').select('*, product:products(id, name, unit)').eq('group_id', groupId).eq('done', false).order('created_at'),
      getForecast(admin, groupId),
      listPurchases(admin, groupId, { limit: 500, since: monthStart }),
    ])
    return json({
      pending_list: pending || [],
      running_out: forecasts.filter((f) => f.forecast.status === 'acabando' || f.forecast.status === 'acabou'),
      month_spending: roundMoney(monthPurchases.reduce((s, p) => s + purchaseTotal(p), 0)),
    })
  })
}
