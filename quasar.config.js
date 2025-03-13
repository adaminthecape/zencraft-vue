import { defineConfig } from '#q-app/wrappers';
import path from 'path';

export default defineConfig((ctx) =>
{
	return {
		eslint: {
			fix: true,
			// include: [],
			// exclude: [],
			// rawOptions: {},
			warnings: true,
			errors: true,
		},

		// https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
		// preFetch: true,

		// app boot file (/src/boot)
		// --> boot files are part of "main.js"
		// https://v2.quasar.dev/quasar-cli-vite/boot-files
		boot: ['pinia', 'i18n', 'handlebars'],

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
		css: ['app.scss'],

		// https://github.com/quasarframework/quasar/tree/dev/extras
		extras: [
			// 'ionicons-v4',
			// 'mdi-v5',
			'fontawesome-v6',
			// 'eva-icons',
			// 'themify',
			// 'line-awesome',
			// 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

			'roboto-font', // optional, you are not bound to it
			'material-icons', // optional, you are not bound to it
		],

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#build
		build: {
			target: {
				browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
				node: 'node16',
			},

			vueRouterMode: 'hash', // available values: 'hash', 'history'
			// vueRouterBase,
			// vueDevtools,
			// vueOptionsAPI: false,

			// rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

			// publicPath: '/',
			// analyze: true,
			// env: {},
			// rawDefine: {}
			// ignorePublicFolder: true,
			// minify: false,
			// polyfillModulePreload: true,
			// distDir

			extendViteConf(viteConf, { isServer, isClient })
			{
				Object.assign(viteConf.resolve.alias, {
					'@': path.join(__dirname, './src'),
					vue: 'vue/dist/vue.esm-bundler.js',
				});
			},
			// viteVuePluginOptions: {},

			// vitePlugins: [
			//   [ 'package-name', { ..options.. } ]
			// ]
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
		devServer: {
			// https: true
			port: 8096,
			open: true, // opens browser window automatically
		},

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
		framework: {
			config: {
				// https://coolors.co/ff6929-d3d3d3-171614-3a2618-754043
				brand: {
					// // primary: "rgb(165, 50, 96)",
					// primary: "rgb(100,0,0)",
					// // positive: "rgb(53, 177, 180)",
					// positive: "rgb(0,110,180)",
					// secondary: "rgb(29, 53, 69)",
					// // accent: "rgb(180, 110, 135)",
					// accent: "rgb(255,0,175)",
					// negative: "#d63e8d",
					// info: "#d45e3e",
					// dark: "#111111",
					// warning: "rgb(255,125,0)",

					// primary: '#d97706',
					// secondary: '#ca8a04',
					// accent: '#65a30d',
					// positive: '#16a34a',
					// negative: '#dc2626',
					// warning: '#ca8a04',
					// info: '#2563eb',

					// primary: '#3A2618',
					// secondary: '#754043',
					// info: '#754043',
					// accent: '#FF6929',
					// dark: '#191308',
					// positive: '#108810',
					// negative: '#A02334',
					// warning: '#FF4C29',
					positiveFaded: '#10881080',
					negativeFaded: '#A0233480',
					neutral: '#aaaaaa',
					neutral05: '#aaaaaa05',
					neutral10: '#aaaaaa10',
					neutral20: '#aaaaaa20',
					neutral40: '#aaaaaa40',
					neutral60: '#aaaaaa60',
					neutral80: '#66666680'
				},
				// GOOD ONE:
				// brand: {
				//   primary: '#222831',
				//   secondary: '#441752',
				//   info: '#AB4459',
				//   accent: '#F29F58',
				//   dark: '#111111',
				//   positive: '#108810',
				//   positiveFaded: '#10881080',
				//   negative: '#A02334',
				//   negativeFaded: '#A0233480',
				//   warning: '#FF4C29',
				//   bgDark: '#222222',
				//   bgLight: '#aaaaaa',
				//   neutral: '#aaaaaa'
				// },
				// brand: {
				//   primary: '#16325B',
				//   secondary: '#227B94',
				//   info: '#384B70',
				//   accent: '#EB8317',
				//   dark: '#111111',
				//   positive: '#006A67',
				//   negative: '#A02334',
				//   warning: '#FF4C29',
				//   bgDark: '#222222',
				//   bgLight: '#aaaaaa',
				//   neutral: '#aaaaaa'
				// },
				// brand: {
				//   primary: '#082032',
				//   secondary: '#2C394B',
				//   info: '#FF6500',
				//   accent: '#E38E49',
				//   dark: '#111111',
				//   positive: '#006A67',
				//   negative: '#A02334',
				//   warning: '#FF4C29',
				//   bgDark: '#222222',
				//   bgLight: '#aaaaaa',
				//   neutral: '#aaaaaa'
				// },
				notify: {
					icon: 'fas fa-exclamation-circle',
					position: 'bottom'
				}
			},

			// iconSet: 'material-icons', // Quasar icon set
			// lang: 'en-US', // Quasar language pack

			// For special cases outside of where the auto-import strategy can have an impact
			// (like functional components as one of the examples),
			// you can manually specify Quasar components/directives to be available everywhere:
			//
			// components: [],
			// directives: [],

			// Quasar plugins
			plugins: ['Notify'],
		},

		// animations: 'all', // --- includes all animations
		// https://v2.quasar.dev/options/animations
		animations: [],

		// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#sourcefiles
		// sourceFiles: {
		//   rootComponent: 'src/App.vue',
		//   router: 'src/router/index',
		//   store: 'src/store/index',
		//   registerServiceWorker: 'src-pwa/register-service-worker',
		//   serviceWorker: 'src-pwa/custom-service-worker',
		//   pwaManifestFile: 'src-pwa/manifest.json',
		//   electronMain: 'src-electron/electron-main',
		//   electronPreload: 'src-electron/electron-preload'
		// },

		// https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
		ssr: {
			// ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
			// will mess up SSR

			// extendSSRWebserverConf (esbuildConf) {},
			// extendPackageJson (json) {},

			pwa: false,

			// manualStoreHydration: true,
			// manualPostHydrationTrigger: true,

			prodPort: 3000, // The default port that the production server should use
			// (gets superseded if process.env.PORT is specified at runtime)

			middlewares: [
				'render', // keep this as last one
			],
		},

		// https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
		pwa: {
			workboxMode: 'generateSW', // or 'injectManifest'
			injectPwaMetaTags: true,
			swFilename: 'sw.js',
			manifestFilename: 'manifest.json',
			useCredentialsForManifestTag: false,
			// useFilenameHashes: true,
			// extendGenerateSWOptions (cfg) {}
			// extendInjectManifestOptions (cfg) {},
			// extendManifestJson (json) {}
			// extendPWACustomSWConf (esbuildConf) {}
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
		cordova: {
			// noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
		capacitor: {
			hideSplashscreen: true,
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
		electron: {
			// extendElectronMainConf (esbuildConf)
			// extendElectronPreloadConf (esbuildConf)

			inspectPort: 5858,

			bundler: 'packager', // 'packager' or 'builder'

			packager: {
				// https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
				// OS X / Mac App Store
				// appBundleId: '',
				// appCategoryType: '',
				// osxSign: '',
				// protocol: 'myapp://path',
				// Windows only
				// win32metadata: { ... }
			},

			builder: {
				// https://www.electron.build/configuration/configuration

				appId: 'data-palace',
			},
		},
		sourceFiles: {
			electronMain: 'src-electron/electron-main.ts',
			electronPreload: 'src-electron/electron-preload.ts'
		},

		// Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
		bex: {
			contentScripts: ['my-content-script'],

			// extendBexScriptsConf (esbuildConf) {}
			// extendBexManifestJson (json) {}
		},
	};
});
