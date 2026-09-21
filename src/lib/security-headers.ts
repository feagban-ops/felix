// Security headers utility for API routes
export function setSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)

  headers.set('X-DNS-Prefetch-Control', 'force-on')
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  headers.set('X-Frame-Options', 'SAMEORIGIN')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy for API responses
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  headers.set('Content-Security-Policy', cspHeader)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
