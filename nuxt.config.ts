const APP_TITLE = 'incoASSETS';
const APP_DESCRIPTION = '';
const APP_URL = process.env.API_BASE_URL;

const { API_BASE_URL, CRYPTO_SECRET_KEY } = process.env;
const API_PREFIX = '/api';

const THEME_COLOR = '#31bc8d';
const COMPATIBILITY_DATE = '2025-05-15';
const DEV_PORT = 3000;

const IS_SEO_ENABLED = false;

export default defineNuxtConfig({
  compatibilityDate: COMPATIBILITY_DATE,
  ssr: IS_SEO_ENABLED,
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  devServer: {
    port: DEV_PORT,
    host: '0.0.0.0',
  },
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: true,
      failOnError: false,
    },
  },
  routeRules: {},
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxtjs/seo',
    '@vite-pwa/nuxt',
  ],
  pinia: {
    storesDirs: ['./stores/**/*'],
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
  imports: {
    dirs: ['utils', 'types', 'composables/services'],
    presets: [
      {
        from: 'vue-sonner',
        imports: ['toast'],
      },
    ],
  },
  css: [
    '@/assets/scss/main.scss',
    '@/assets/fonts/notosanskr/notosanskr.css',
    '@/assets/fonts/pretendard/pretendard.css',
    '@/assets/fonts/materialicons/materialicons.css',
    '@/assets/fonts/incofont/inco-icons.css',
    '@/assets/css/tailwind.css',
  ],
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
    },
    esbuild: {
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    server: {
      allowedHosts: true,
    },
  },
  runtimeConfig: {
    apiBaseUrl: `${API_BASE_URL}${API_PREFIX}`, // 서버사이드 전용 (SSR에서 API 직접 호출용)
    public: {
      appTitle: APP_TITLE,
      appDescription: APP_DESCRIPTION,
      appUrl: APP_URL,
      baseURL: API_PREFIX,
      serverURL: API_BASE_URL, // 정적 파일용 (직접 접근)
      cryptoKey: CRYPTO_SECRET_KEY,
      isSeoEnabled: IS_SEO_ENABLED,
    },
  },
  site: {
    url: APP_URL,
    name: APP_TITLE,
    description: APP_DESCRIPTION,
    defaultLocale: 'ko',
    indexable: IS_SEO_ENABLED,
  },
  robots: {
    enabled: IS_SEO_ENABLED,
    allow: IS_SEO_ENABLED ? ['/'] : [],
    disallow: IS_SEO_ENABLED ? [] : ['/'],
  },
  ogImage: {
    enabled: IS_SEO_ENABLED,
  },
  sitemap: {
    enabled: IS_SEO_ENABLED,
    exclude: ['/admin/**'],
  },
  pwa: {
    registerType: 'autoUpdate',
    injectRegister: 'script',
    manifest: {
      name: APP_TITLE,
      short_name: APP_TITLE,
      description: APP_DESCRIPTION,
      theme_color: THEME_COLOR,
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        {
          src: '/images/favicon/favicon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/images/favicon/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/images/favicon/favicon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: 'classic',
    },
  },
  app: {
    head: {
      title: APP_TITLE,
      // 모든 페이지의 title 을 APP_TITLE 로 고정 — @nuxtjs/seo 의 깨진 기본 템플릿(%siteName 미치환) 우회
      titleTemplate: APP_TITLE,
      meta: [
        { name: 'theme-color', content: THEME_COLOR },
        // SEO 마스터 스위치에 따른 로봇 제어
        ...(!IS_SEO_ENABLED
          ? [{ name: 'robots', content: 'noindex, nofollow, noarchive' }]
          : [
              { name: 'description', content: APP_DESCRIPTION },
              { property: 'og:type', content: 'website' },
              { property: 'og:title', content: APP_TITLE },
              { property: 'og:description', content: APP_DESCRIPTION },
              { property: 'og:locale', content: 'ko_KR' },
              // { property: 'og:image', content: `${APP_URL}/images/og/og-image.png` },
              // { name: 'twitter:card', content: 'summary_large_image' },
              // { name: 'twitter:title', content: APP_TITLE },
              // { name: 'twitter:description', content: APP_DESCRIPTION },
              // { name: 'twitter:image', content: `${APP_URL}/images/og/og-image.png` },
            ]),
      ],
      link: [
        // { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/x-icon', href: '/images/favicon/favicon.ico' },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/images/favicon/favicon-32x32.png',
        },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/favicon/favicon-180x180.png' },
      ],
    },
  },
});
