export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head

  head: {
    title: 'web-frontend-boilerplate',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    '@nuxtjs/tailwindcss',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/auth-next'
  ],
  auth: {
    strategies: {
      local: {
        token: {
          property: 'access_token',
          type: 'Bearer',
        },
        user: {
          property: '',
        },
        endpoints: {
          login: { url: 'http://localhost:3333/user/auth', method: 'post' },
          user: { url: 'http://localhost:3333/user/cur', method: 'get' },
        },
      },
    },
    redirect: {
      login: '/auth',
      logout: '/',
      callback: '/auth',
      home: '/app',
    }
  },


  router: {
    middleware: ['auth']
  },
  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // PWA module configuration: https://go.nuxtjs.dev/pwa


  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
}
