const DEFAULT_PUBLIC_APP_URL = 'https://mydindin.com.br'

export function getPublicAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return configuredUrl || DEFAULT_PUBLIC_APP_URL
}

export function getPublicAppUrlWithPath(path = '') {
  const baseUrl = getPublicAppUrl().replace(/\/$/, '')
  const normalizedPath = path ? (path.startsWith('/') ? path : `/${path}`) : ''
  return `${baseUrl}${normalizedPath}`
}
