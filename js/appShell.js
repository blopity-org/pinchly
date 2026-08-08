import { query, renderHtml, createIcon, createListItems } from './utils.js';
import { getCurrentUser, renderAuthControls } from './auth.js';
import { getLocale } from './i18n.js';

const appShellSelectors = {
    pageTitle: '#pageTitle',
    appGrid: '#appGrid',
    footerContainer: '#footerLanguage',
};

export function renderAppShell({ pageTitle, apps }) {
    const loggedIn = Boolean(getCurrentUser());
    const titleText = pageTitle || 'Pinchly Apps';
    renderHtml(query(appShellSelectors.pageTitle), titleText);

    const items = apps
        .map((app) => {
            const icon = app.thumbnail
                ? `<img class="app-thumbnail" src="${app.thumbnail}" alt="${app.title} thumbnail">`
                : `<span class="app-emoji">${app.emoji || '🧩'}</span>`;
            return `
            <article class="app-card" data-app-id="${app.id}">
                <a class="app-card-link" href="${app.url || '#'}">
                    <div class="app-card-icon">${icon}</div>
                    <div class="app-card-content">
                        <h2>${app.title}</h2>
                        <p>${app.subtitle}</p>
                    </div>
                </a>
                ${loggedIn ? '<div class="app-card-actions"><button class="btn-secondary app-save-btn">Save</button></div>' : ''}
            </article>
        `;
        })
        .join('');

    renderHtml(query(appShellSelectors.appGrid), items);
    const authContainer = query('#authControls');
    if (authContainer) renderAuthControls(authContainer);
}

export function initFooterLanguage(selectorId, locales) {
    const footer = query(selectorId);
    if (!footer) return;
    renderHtml(
        footer,
        `<small>Language: <select id="siteLanguageSelector">${createListItems(locales, (id, label) => `<option value="${id}">${label}</option>`)}</select></small>`
    );
}

export function bindAppShellEvents() {
    const saveButtons = Array.from(document.querySelectorAll('.app-save-btn'));
    saveButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const card = button.closest('.app-card');
            if (!card) return;
            const appId = card.dataset.appId;
            if (!appId) return;
            console.log(`Saved app ${appId}`);
            button.textContent = 'Saved';
            button.disabled = true;
        });
    });
}
