import { json } from '../../../../src/lib/comprasRoute'

export async function GET() {
  return json({ ok: true, service: 'mydindin-compras' })
}
