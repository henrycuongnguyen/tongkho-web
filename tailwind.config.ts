import type { Config } from 'tailwindcss';

/**
 * Tailwind CSS v4 Configuration
 *
 * Note: In Tailwind v4, most configuration is done via CSS using @theme directive
 * in src/styles/global.css. This file exists primarily for IDE IntelliSense support.
 *
 * @see src/styles/global.css for theme customization
 */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
  ],
} satisfies Config;
