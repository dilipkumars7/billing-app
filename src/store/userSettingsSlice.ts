import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserSettingsState {
  settings: any | null;
}

const initialState: UserSettingsState = {
  settings: null,
};

const userSettingsSlice = createSlice({
  name: "userSettings",
  initialState,
  reducers: {
    setUserSettings(state, action: PayloadAction<any>) {
      state.settings = action.payload;
    },
  },
});

export const { setUserSettings } = userSettingsSlice.actions;
export default userSettingsSlice.reducer;
