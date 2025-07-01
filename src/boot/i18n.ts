import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import en from 'src/i18n/en';

const i18n = createI18n({
	locale: navigator.language,
	fallbackLocale: 'en',
	messages: {
		en
	},
	legacy: false
});

export default boot(({ app }) =>
{
	app.use(i18n);
});
