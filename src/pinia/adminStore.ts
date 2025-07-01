import { auth, rtdb } from 'zencraft-core';
import { defineStore } from 'pinia';
import { DatabaseHandlerType } from './genericItemStore';

type RootState = {
  isAdmin: boolean;
  isEditMode: boolean;
  authHandler: auth.FirebaseAuth | undefined;
  dbHandler: DatabaseHandlerType | undefined;
};

const useAdminStore = defineStore('adminStore', {
	state: () =>
		({
			authHandler: undefined,
			dbHandler: undefined,
			isAdmin: true,
			isEditMode: (localStorage.getItem('admin_edit_mode') === 'true'),
		} as RootState),
	getters: {
		getIsAdmin: (state) => state.isAdmin,
		getIsEditMode: (state) => state.isEditMode,
	},
	actions: {
		async firebaseLogin(username: string, password: string)
		{
			const {
				VITE_FIREBASE_API_KEY,
				VITE_FIREBASE_APP_ID,
				VITE_FIREBASE_AUTH_DOMAIN,
				VITE_FIREBASE_DATABASE_URL,
				VITE_FIREBASE_MESSAGING_SENDER_ID,
				VITE_FIREBASE_PROJECT_ID,
				VITE_FIREBASE_STORAGE_BUCKET,
				VITE_LOCAL_PASS,
				VITE_LOCAL_USER,
			} = (import.meta as any).env;

			// Auth is a dependency of RTDB, so if you're using an API intermediary,
			// you can skip Auth and just pass around your RTDB instance, which will
			// connect to your API and pipe requests through to Firebase
			this.authHandler = new auth.FirebaseAuth({
				userAccount: {
					email: username || VITE_LOCAL_USER,
					password: password || VITE_LOCAL_PASS
				},
				customConfig: {
					apiKey: VITE_FIREBASE_API_KEY,
					authDomain: VITE_FIREBASE_AUTH_DOMAIN,
					databaseURL: VITE_FIREBASE_DATABASE_URL,
					projectId: VITE_FIREBASE_PROJECT_ID,
					storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
					messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
					appId: VITE_FIREBASE_APP_ID,
				} as auth.FirebaseConfig
			});

			this.dbHandler = new rtdb.FirebaseRTDB({
				auth: (this.authHandler as auth.FirebaseAuth)
			});

			await this.authHandler.authorize();
		},
		setEditMode(value: boolean)
		{
			this.SET_EDIT_MODE(value);
		},
		SET_EDIT_MODE(value: boolean)
		{
			this.isEditMode = value;
			localStorage.setItem('admin_edit_mode', value ? 'true' : 'false');
		},
	},
});

export default useAdminStore;
