// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

import { query, queryAll, renderHtml, escapeHtml, SELECTORS } from './utils.js';

const LOCALE_KEY = 'pinchly-locale';
const FALLBACK_LOCALE = 'en';

const TRANSLATIONS = {
    en: {
        login_title: 'Sign in to Blopity Pinch',
        login_username: 'Email',
        login_password: 'Password',
        login_button: 'Login',
        logout_button: 'Logout',
        welcome_back: 'Welcome back!',
        login_failed: 'Sign-in failed. Check your email and password.',
        app_json_data: 'App JSON Data',
        save_app_data: 'Save app data',
        reset_preview: 'Reset preview',
        storage_signed_in: 'Save your structured app data for this account.',
        storage_guest: 'Login to save changes locally and revisit them later.',
        js_coding_interface: 'JS Coding Interface',
        js_coding_description:
            'Use storage, data, and user in live code to shape this app.',
        run_code: 'Run code',
        terminal_cli: 'Terminal CLI',
        terminal_description:
            'Try help, echo, json, get, set, and clear commands.',
        cli_input_label: 'CLI command input',
        code_output_placeholder: 'Code output appears here.',
        footer_language: 'Language',
        footer_crafted: 'Made with Blopity Pinch.',
        inbox_title: 'Blopity Pinch Inbox',
        inbox_description:
            'Notifications about social activity, updates, and programming news.',
        inbox_empty: 'No notifications yet. Check back soon.',
        mark_all_read: 'Mark all read',
    },
    es: {
        login_title: 'Inicia sesión en Blopity Pinch',
        login_username: 'Correo electrónico',
        login_password: 'Contraseña',
        login_button: 'Ingresar',
        logout_button: 'Cerrar sesión',
        welcome_back: '¡Bienvenido de nuevo!',
        login_failed:
            'Error de inicio de sesión. Revisa el correo y la contraseña.',
        app_json_data: 'Datos JSON de la app',
        save_app_data: 'Guardar datos',
        reset_preview: 'Restablecer vista previa',
        storage_signed_in: 'Guarda los datos estructurados de tu cuenta.',
        storage_guest: 'Inicia sesión para guardar cambios localmente.',
        js_coding_interface: 'Interfaz de JS',
        js_coding_description:
            'Usa storage, data y user en código en vivo para moldear esta app.',
        run_code: 'Ejecutar código',
        terminal_cli: 'Terminal CLI',
        terminal_description: 'Prueba help, echo, json, get, set y clear.',
        cli_input_label: 'Entrada de comando CLI',
        code_output_placeholder: 'La salida del código aparece aquí.',
        footer_language: 'Idioma',
        footer_crafted: 'Hecho con Blopity Pinch.',
        inbox_title: 'Bandeja de Blopity Pinch',
        inbox_description:
            'Notificaciones de actividad social, actualizaciones y noticias de programación.',
        inbox_empty: 'Aún no hay notificaciones. Vuelve pronto.',
        mark_all_read: 'Marcar todo como leído',
    },
};

export function getCurrentLocale() {
    return localStorage.getItem(LOCALE_KEY) || FALLBACK_LOCALE;
}

export function setCurrentLocale(locale) {
    if (!TRANSLATIONS[locale]) {
        locale = FALLBACK_LOCALE;
    }
    localStorage.setItem(LOCALE_KEY, locale);
    return locale;
}

export function translateKey(key, replacements = {}) {
    const locale = getCurrentLocale();
    const template =
        TRANSLATIONS[locale]?.[key] ||
        TRANSLATIONS[FALLBACK_LOCALE]?.[key] ||
        key;
    return Object.keys(replacements).reduce(
        (text, replacementKey) =>
            text.replace(
                new RegExp(`\\{${replacementKey}\\}`, 'g'),
                escapeHtml(replacements[replacementKey])
            ),
        template
    );
}

export function translatePage() {
    queryAll('[data-i18n]').forEach((element) => {
        const key = element.dataset.i18n;
        const translation = translateKey(key);

        if (
            element.tagName === 'INPUT' ||
            element.tagName === 'TEXTAREA' ||
            element.tagName === 'SELECT'
        ) {
            element.placeholder = translation;
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            }
        } else {
            element.textContent = translation;
        }
    });
}

export function renderLanguageFooter() {
    const footer = query(SELECTORS.pageFooter);
    if (!footer) return;

    const locale = getCurrentLocale();
    const options = Object.keys(TRANSLATIONS)
        .map(
            (lang) => `
            <option value="${lang}"${lang === locale ? ' selected' : ''}>
                ${lang.toUpperCase()}
            </option>`
        )
        .join('');

    renderHtml(
        footer,
        `
            <div class="footer-grid">
                <div class="footer-copy">
                    <span>${escapeHtml(translateKey('footer_crafted'))}</span>
                </div>
                <div class="footer-actions">
                    <label for="languageSelect">${escapeHtml(translateKey('footer_language'))}</label>
                    <select id="languageSelect" class="language-select">${options}</select>
                </div>
            </div>
        `
    );

    const selector = query('#languageSelect');
    if (selector) {
        selector.addEventListener('change', (event) => {
            setCurrentLocale(event.target.value);
            translatePage();
            renderLanguageFooter();
        });
    }
}

export function initI18n() {
    translatePage();
    renderLanguageFooter();
}
