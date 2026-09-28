/**
 * Client-side theme control. Three modes:
 *   'auto'  → follow the OS (CSS prefers-color-scheme); no data-theme attribute.
 *   'light' → force light  (data-theme="light" overrides the media query).
 *   'dark'  → force dark   (data-theme="dark").
 *
 * The choice persists in localStorage. app.html applies it before first paint
 * (no flash); this util keeps it in sync when the user changes it at runtime.
 */
export type Theme = 'auto' | 'light' | 'dark';

const KEY = 'theme';

export function getTheme(): Theme {
	if (typeof localStorage === 'undefined') return 'auto';
	const t = localStorage.getItem(KEY);
	return t === 'light' || t === 'dark' ? t : 'auto';
}

export function setTheme(theme: Theme): void {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	if (theme === 'auto') {
		root.removeAttribute('data-theme');
		try {
			localStorage.removeItem(KEY);
		} catch {
			/* ignore */
		}
	} else {
		root.setAttribute('data-theme', theme);
		try {
			localStorage.setItem(KEY, theme);
		} catch {
			/* ignore */
		}
	}
}
