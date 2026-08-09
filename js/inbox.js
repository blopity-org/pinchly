// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

import {
    query,
    renderHtml,
    createIcon,
    escapeHtml,
    SELECTORS,
    ICONS,
} from './utils.js';
import { getCurrentUser } from './auth.js';

const INBOX_KEY = 'pinchly-inbox-read';

const NOTIFICATIONS = [
    {
        id: 'social-01',
        type: 'social',
        title: 'New follower',
        message: '@pinchi started following you.',
        subtext: 'Your network grows stronger.',
        badge: 'Social',
        time: '2m ago',
    },
    {
        id: 'news-01',
        type: 'news',
        title: 'Python 3.14 release',
        message:
            'Python 3.14 is now out with new async and string improvements.',
        subtext: 'Catch the latest programming news.',
        badge: 'News',
        time: 'Today',
    },
    {
        id: 'news-02',
        type: 'news',
        title: 'Pinchly update',
        message:
            'App thumbnails, Inbox feeds, and language selector are now live.',
        subtext: 'The platform is getting more polished and experimental.',
        badge: 'Update',
        time: 'Just now',
    },
];

function getReadIds() {
    const raw = localStorage.getItem(INBOX_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function setReadIds(ids) {
    localStorage.setItem(INBOX_KEY, JSON.stringify(ids));
}

export function renderInboxPage() {
    const inboxContainer = query(SELECTORS.inboxContainer);
    if (!inboxContainer) return;

    const hasUser = Boolean(getCurrentUser());
    const content = `
        <div class="inbox-hero">
            <div>
                <span class="eyebrow">Inbox</span>
                <h1>Pinchly notifications</h1>
                <p>Social actions, platform updates, and programming news all land here.</p>
            </div>
            <button class="btn-secondary" id="markAllReadBtn">Mark all read</button>
        </div>
        <div class="inbox-grid">
            ${renderInboxCards()}
        </div>
        <div class="mwk-tip inbox-help">
            ${hasUser ? 'Signed in actions appear in your account feed.' : 'Sign in to enable deeper notifications and saved inbox state.'}
        </div>
    `;

    renderHtml(inboxContainer, content);
    const markAllRead = query('#markAllReadBtn');
    if (markAllRead) {
        markAllRead.addEventListener('click', () => {
            setReadIds(NOTIFICATIONS.map((item) => item.id));
            renderInboxPage();
        });
    }
}

function renderInboxCards() {
    const readIds = getReadIds();
    return NOTIFICATIONS.map((item) => {
        const isRead = readIds.includes(item.id);
        return `
            <article class="inbox-card ${isRead ? 'read' : 'unread'}">
                <div class="inbox-card-header">
                    <span class="notification-badge">${escapeHtml(item.badge)}</span>
                    <span class="notification-time">${escapeHtml(item.time)}</span>
                </div>
                <h2>${escapeHtml(item.title)}</h2>
                <p>${escapeHtml(item.message)}</p>
                <p class="notification-subtext">${escapeHtml(item.subtext)}</p>
                <div class="notification-footer">
                    <span>${createIcon(item.type === 'news' ? ICONS.rocket : ICONS.bell, item.type)}</span>
                    ${isRead ? '<span class="notification-pill">Read</span>' : '<span class="notification-pill notification-pill-new">New</span>'}
                </div>
            </article>
        `;
    }).join('');
}
