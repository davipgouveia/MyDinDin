import { withAuth, json } from '../../../../src/lib/comprasRoute'

export async function GET(request) {
  return withAuth(request, async ({ admin, userId, groupId, via }) => {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, role, group_id')
      .eq('id', userId)
      .maybeSingle()
    const { data: group } = await admin
      .from('family_groups')
      .select('id, name')
      .eq('id', groupId)
      .maybeSingle()
    return json({ user: profile, group, via })
  })
}
