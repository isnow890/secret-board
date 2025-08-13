// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-01-15",
  devtools: { enabled: true },

  app: {
    baseURL: "/secret/",
    head: {
      title: "secret me",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "secret me" },
        { name: "author", content: "secret" },
        {
          name: "keywords",
          content: "secret",
        },

        // Theme and misc
        { name: "theme-color", content: "#1a1a1a" },
        { name: "msapplication-TileColor", content: "#1a1a1a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/secret/favicon.ico" },
        { rel: "apple-touch-icon", href: "/secret/images/only_head.png" },
        { rel: "canonical", href: "https://hit.eumc.ac.kr/secret/" },
      ],
    },
  },

  experimental: {
    payloadExtraction: false,
  },

  ssr: true,

  // 에러 페이지 설정

  modules: [
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "@nuxt/icon",
    "@nuxt/image",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "nuxt-tiptap-editor",
  ],

  image: {
    // 이미지 최적화 설정
    quality: 85,
    format: ["webp", "png", "jpg"],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    densities: [1, 2],
  },

  icon: {
    provider: "iconify",
    class: "",
    aliases: {},
  },

  vite: {
    plugins: [],
    server: {
      hmr: {
        overlay: false, // Reduce HMR noise in development
      },
    },
  },

  css: ["@/assets/css/linear-theme.css"],

  imports: {
    autoImport: true,
    dirs: ["~/composables", "~/composables/**"],
  },
  components: {
    global: true,
    dirs: [
      {
        path: "~/components",
        pathPrefix: false,
        extensions: [".vue"],
      },
    ],
  },

  runtimeConfig: {
    // 서버 전용 (비공개)
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    serverApiKey: process.env.SERVER_API_KEY,

    // 클라이언트에서도 접근 가능 (공개)
    public: {
      sitePassword: process.env.SITE_PASSWORD,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      serverApiKey: process.env.SERVER_API_KEY, // 클라이언트에서 사용

      // 쿠팡 파트너스 광고 설정
      adVisible: process.env.AD_VISIBLE,
      coupangSidebarAdUrl: process.env.COUPANG_SIDEBAR_AD_URL,
      coupangPostAdUrl: process.env.COUPANG_POST_AD_URL,
      adSidebarEnabled: process.env.AD_SIDEBAR_ENABLED,
      adPostDetailEnabled: process.env.AD_POST_DETAIL_ENABLED,
    },
  },

  supabase: {
    // Supabase 환경변수가 없어도 개발 가능하도록 설정
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_ANON_KEY || "",
    serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
    types: "./types/supabase.ts",
    // 자동 로그인 리다이렉트 완전 비활성화
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: undefined,
      exclude: ["/", "/*"], // 모든 페이지 제외
    },
  },

  nitro: {
    routeRules: {
      // API 경로가 baseURL을 따르도록 설정
      "/secret/api/**": {
        proxy: { to: "/api/**" },
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    },
  },
});
