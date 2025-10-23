// Disable SSR for the entire app (client-side only rendering)
// This avoids hydration issues and is fine for a trading app that doesn't need SEO
export const ssr = false;
export const prerender = false;
