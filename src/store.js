import { configureStore, createSlice } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // default: localStorage

const initialAuthState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: 'franchisoAuth',
  initialState: initialAuthState,
  reducers: {
    setAuth(state, action) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    logout(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;

const persistConfig = {
  key: 'franchisoAuth',
  storage,
};

const persistedReducer = persistReducer(persistConfig, authSlice.reducer);

const store = configureStore({
  reducer: {
    franchisoAuth: persistedReducer,
  },
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);
export default store;