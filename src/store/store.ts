import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userSettingsReducer from "./userSettingsSlice";


const appReducer = combineReducers({
  userSettings: userSettingsReducer,
  // add other reducers here
});

// 🔥 Root reducer that clears state when RESET_STORE is dispatched
const rootReducer = (state: any, action: any) => {
  if (action.type === "RESET_STORE") {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
