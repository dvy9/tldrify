export type Route = { name: 'new' } | { name: 'summary'; id: string } | { name: 'not_found' }

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, '')
  const parts = h.split('/').filter(Boolean)
  if (parts.length === 0) return { name: 'new' }
  if (parts[0] === 'new') return { name: 'new' }
  if (parts[0] === 's' && parts[1]) return { name: 'summary', id: parts[1] }
  return { name: 'not_found' }
}

export function toHash(route: Route): string {
  switch (route.name) {
    case 'new':
      return '#/new'
    case 'summary':
      return `#/s/${route.id}`
    case 'not_found':
      return '#/404'
  }
}

export function navigate(route: Route) {
  const next = toHash(route)
  if (window.location.hash !== next) {
    window.location.hash = next
  } else {
    // force hashchange for same hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
}
