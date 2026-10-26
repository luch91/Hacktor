export const themePreferences = ['dark', 'light', 'system'] as const;
export type ThemePreference = (typeof themePreferences)[number];
