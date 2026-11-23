import { withAuth, json } from '../../../../src/lib/comprasRoute'
import { getForecast } from '../../../../src/lib/comprasServer'

export async function GET(request) {
  return withAuth(request, async ({ admin, groupId }) => {
    const withinDays = Number(new URL(request.url).searchParams.get('within_days')) || null
    let rows = await getForecast(admin, groupId)
    if (withinDays != null) {
      rows = rows.filter(
        (r) => r.forecast.status !== 'sem_dados' && (r.forecast.days_left == null || r.forecast.days_left <= withinDays),
      )
    }
    return json(rows)
  })
}
