import { defineStore } from 'pinia';
import { Dark } from 'quasar';

type RootState = {
  activeTheme: string;
  defaultQuasarProps: Record<string, unknown>;
};

const useThemeStore = defineStore('themeStore', {
	state: () =>
		({
			activeTheme: localStorage.getItem('activeTheme') || 'light',
			defaultQuasarProps: {
				filled: true,
				dense: true,
			}
		} as RootState),
	getters: {
		getActiveTheme: (state) => state.activeTheme,
		getDefaultQuasarProps: (state) => state.defaultQuasarProps,
	},
	actions: {
		setLightMode()
		{
			this.SET_ACTIVE_THEME('light');
			Dark.set(false);
		},
		setDarkMode()
		{
			this.SET_ACTIVE_THEME('dark');
			Dark.set(true);
		},
		SET_ACTIVE_THEME(themeName: string)
		{
			this.activeTheme = themeName;
			localStorage.setItem('activeTheme', themeName);
		},
	},
});

export default useThemeStore;
