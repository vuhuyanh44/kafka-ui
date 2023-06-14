import React from 'react';
import type { FC, PropsWithChildren } from 'react';
import type { ThemeDropDownValue } from 'components/NavBar/NavBar';

interface ThemeModeContextProps {
  isDarkMode: boolean;
  themeMode: ThemeDropDownValue;
  setThemeMode: (value: string | number) => void;
}

export const ThemeModeContext = React.createContext<ThemeModeContextProps>({
  isDarkMode: false,
  themeMode: 'auto_theme',
  setThemeMode: () => {},
});

export const ThemeModeProvider: FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const matchDark = window.matchMedia('(prefers-color-scheme: dark)');
  const [themeMode, setThemeModeState] =
    React.useState<ThemeDropDownValue>('auto_theme');

  React.useLayoutEffect(() => {
    const mode = localStorage.getItem('mode');
    setThemeModeState((mode as ThemeDropDownValue) ?? 'auto_theme');
  }, []);

  const isDarkMode = React.useMemo(() => {
    if (themeMode === 'auto_theme') {
      return matchDark.matches;
    }
    return themeMode === 'dark_theme';
  }, []);

  const setThemeMode = React.useCallback((value: string | number) => {
    setThemeMode(value as ThemeDropDownValue);
    localStorage.setItem('mode', value as string);
  }, []);

  return (
    <ThemeModeContext.Provider
      value={{
        isDarkMode,
        themeMode,
        setThemeMode,
      }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
};
