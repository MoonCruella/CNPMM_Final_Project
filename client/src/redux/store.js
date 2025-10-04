import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Thêm reducers khác ở đây nếu cần
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      // Bỏ qua check serializable cho các action này
      ignoredActions: [
        'auth/fetchCurrentUser/fulfilled',
        'auth/login/fulfilled',
        'auth/loginSeller/fulfilled'
      ]
    }
  })
});