// Lightweight Umami analytics wrapper
// Page views are tracked automatically by the script tag in index.html

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, string | number>) => void
    }
  }
}

export function track(event: string, data?: Record<string, string | number>): void {
  try {
    window.umami?.track(event, data)
  } catch {
    // Never break the app for analytics
  }
}
