// Remove this file when the nav-apps API is removed. Until then, this file fetches the nav-apps from the CDN and validates them.

const NAV_APPS_URL = 'https://cdn.shadcnstudio.com/ss-assets/template/admincn/nav-apps.json'

export type NavApp = {
  icon: string
  name: string
  href: string
  openInNewTab?: boolean
}

const isValidNavApp = (value: unknown): value is NavApp => {
  if (!value || typeof value !== 'object') return false

  const app = value as Record<string, unknown>

  return (
    typeof app.icon === 'string' &&
    typeof app.name === 'string' &&
    typeof app.href === 'string' &&
    (app.openInNewTab === undefined || typeof app.openInNewTab === 'boolean')
  )
}

export const getNavApps = async (): Promise<NavApp[]> => {
  try {
    const response = await fetch(NAV_APPS_URL)

    if (!response.ok) return []

    const payload = (await response.json()) as unknown

    if (!Array.isArray(payload)) return []

    const validApps = payload.filter(isValidNavApp)

    return validApps
  } catch {
    return []
  }
}