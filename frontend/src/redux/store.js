import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './slices/dashboardSlice';
import accountingReducer from './slices/accountingSlice';

export const store = configureStore({
    reducer: {
        dashboard: dashboardReducer,
        accounting: accountingReducer,
    },
});
