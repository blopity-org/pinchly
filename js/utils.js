// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

export const SELECTORS = {
    authBar: '#auth-bar',
    appContainer: '#app-container',
    inboxContainer: '#inbox-container',
    authStatus: '#authStatus',
    pageFooter: '#page-footer',
};

export const ICONS = {
    user: 'fa-user',
    signIn: 'fa-right-to-bracket',
    signOut: 'fa-right-from-bracket',
    terminal: 'fa-terminal',
    code: 'fa-code',
    database: 'fa-database',
    info: 'fa-circle-info',
    arrowLeft: 'fa-arrow-left',
    bell: 'fa-bell',
    rocket: 'fa-rocket-launch',
    sparkles: 'fa-sparkles',
};

export function query(selector) {
    return document.querySelector(selector);
}

export function queryAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

export function renderHtml(target, html) {
    if (!target) return;
    target.innerHTML = html;
}

export function createIcon(name, label = '') {
    const title = label ? ` title="${escapeHtml(label)}"` : '';
    return `<i class="fa-solid ${name}" aria-hidden="true"${title}></i>`;
}

export function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function getUrlParamsManual() {
    const params = {};
    const query = window.location.search.replace(/^\?/, '');
    query.split('&').forEach((entry) => {
        if (!entry) return;
        const [key, value] = entry.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
}
