import { escapeHtml } from './utils.js';
import {
    addDoc,
    auth,
    collection,
    db,
    doc,
    firebaseConfigured,
    limit,
    onAuthStateChanged,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from './firebase.js';

const inboxContainer = document.querySelector('#inbox-container');
let stopListening;

if (inboxContainer) {
    if (!firebaseConfigured) {
        showMessage(
            'Connect Firebase to enable your inbox. Follow the setup steps in NOTES.md.',
            'setup'
        );
    } else {
        onAuthStateChanged(auth, (user) => {
            stopListening?.();
            stopListening = null;
            if (!user) {
                showSignInPrompt();
                return;
            }
            renderInbox(user);
            listenForMessages(user);
        });
    }
}

function showMessage(message, kind = '') {
    const messages = inboxContainer.querySelector('#inboxMessages');
    if (messages) {
        messages.innerHTML = `<p class="inbox-state ${kind}" role="status">${escapeHtml(message)}</p>`;
        return;
    }
    inboxContainer.innerHTML = `<div class="inbox-state ${kind}"><p>${escapeHtml(message)}</p></div>`;
}

function showSignInPrompt() {
    inboxContainer.innerHTML = `
        <section class="inbox-state">
            <span class="eyebrow">Private inbox</span>
            <h2>Sign in to read your messages</h2>
            <p>Messages are delivered to the email address on your account.</p>
            <a class="btn-primary inbox-signin-link" href="#auth-bar">Go to sign in</a>
        </section>
    `;
}

function renderInbox(user) {
    inboxContainer.innerHTML = `
        <section class="inbox-hero">
            <div>
                <span class="eyebrow">Private inbox</span>
                <h2>Your messages</h2>
                <p>Send a note to another registered account by email.</p>
            </div>
            <span class="inbox-address">${escapeHtml(user.email || '')}</span>
        </section>
        <section class="inbox-compose">
            <h3>New message</h3>
            <form id="composeMessageForm">
                <div class="inbox-compose-fields">
                    <div class="mwk-field">
                        <label for="messageTo">To</label>
                        <input id="messageTo" name="recipientEmail" type="email" autocomplete="email" maxlength="254" placeholder="name@example.com" required>
                    </div>
                    <div class="mwk-field">
                        <label for="messageSubject">Subject</label>
                        <input id="messageSubject" name="subject" type="text" maxlength="120" required>
                    </div>
                </div>
                <div class="mwk-field">
                    <label for="messageBody">Message</label>
                    <textarea id="messageBody" name="body" maxlength="3000" rows="4" required></textarea>
                </div>
                <button class="btn-primary" type="submit">Send message</button>
                <p class="auth-status" id="composeStatus" role="status" aria-live="polite"></p>
            </form>
        </section>
        <section class="inbox-list-section" aria-labelledby="inbox-list-title">
            <div class="inbox-list-heading">
                <h3 id="inbox-list-title">Received</h3>
                <span id="unreadCount" class="notification-pill"></span>
            </div>
            <div id="inboxMessages" class="inbox-grid" aria-live="polite">
                <p class="inbox-state">Loading messages…</p>
            </div>
        </section>
    `;
    inboxContainer
        .querySelector('#composeMessageForm')
        .addEventListener('submit', (event) => sendMessage(event, user));
}

async function sendMessage(event, user) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('#composeStatus');
    const values = new FormData(form);
    const recipientEmail = values.get('recipientEmail').trim().toLowerCase();
    const subject = values.get('subject').trim();
    const body = values.get('body').trim();

    if (!subject || !body) {
        status.textContent = 'Add a subject and message before sending.';
        return;
    }

    button.disabled = true;
    status.textContent = 'Sending…';
    try {
        await addDoc(collection(db, 'inboxMessages'), {
            recipientEmail,
            senderUid: user.uid,
            senderEmail: user.email,
            subject,
            body,
            read: false,
            createdAt: serverTimestamp(),
        });
        form.reset();
        status.textContent = 'Message sent.';
    } catch (error) {
        status.textContent = firestoreErrorMessage(error);
    } finally {
        button.disabled = false;
    }
}

function listenForMessages(user) {
    const messagesQuery = query(
        collection(db, 'inboxMessages'),
        where('recipientEmail', '==', (user.email || '').toLowerCase()),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    stopListening = onSnapshot(
        messagesQuery,
        (snapshot) => {
            const messages = snapshot.docs.map((message) => ({
                id: message.id,
                ...message.data(),
            }));
            renderMessages(messages);
        },
        (error) => {
            console.error('Firestore inbox listener failed:', error);
            const unreadCount = inboxContainer.querySelector('#unreadCount');
            if (unreadCount) unreadCount.textContent = 'Inbox unavailable';
            showFirestoreError(error);
        }
    );
}

function showFirestoreError(error) {
    const list = inboxContainer.querySelector('#inboxMessages');
    if (!list) {
        showMessage(firestoreErrorMessage(error), 'error');
        return;
    }

    const state = document.createElement('p');
    state.className = 'inbox-state error';
    state.setAttribute('role', 'status');
    state.textContent = firestoreErrorMessage(error);

    if (error?.code?.endsWith('failed-precondition')) {
        const indexUrl = error.message.match(
            /https:\/\/console\.firebase\.google\.com\/[^\s]+/
        )?.[0];
        if (indexUrl) {
            const link = document.createElement('a');
            link.className = 'inbox-index-link';
            link.href = indexUrl.replace(/[),.;]+$/, '');
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Create required index';
            state.append(document.createElement('br'), link);
        }
    }

    list.replaceChildren(state);
}

function renderMessages(messages) {
    const list = inboxContainer.querySelector('#inboxMessages');
    const unreadCount = inboxContainer.querySelector('#unreadCount');
    const unread = messages.filter((message) => !message.read).length;
    unreadCount.textContent = unread ? `${unread} unread` : 'All caught up';

    if (!messages.length) {
        list.innerHTML =
            '<p class="inbox-state">No messages yet. Notes sent to your account email will appear here.</p>';
        return;
    }

    list.innerHTML = messages
        .map((message) => {
            const date =
                message.createdAt?.toDate?.().toLocaleString() || 'Just now';
            return `
            <article class="inbox-card ${message.read ? 'read' : 'unread'}">
                <div class="inbox-card-header">
                    <span class="notification-badge">${escapeHtml(message.senderEmail || 'Pinchly member')}</span>
                    <time class="notification-time">${escapeHtml(date)}</time>
                </div>
                <h3>${escapeHtml(message.subject)}</h3>
                <p class="inbox-message-body">${escapeHtml(message.body).replace(/\n/g, '<br>')}</p>
                ${message.read ? '<span class="notification-pill">Read</span>' : `<button class="btn-secondary mark-read" type="button" data-message-id="${escapeHtml(message.id)}">Mark read</button>`}
            </article>
        `;
        })
        .join('');

    list.querySelectorAll('.mark-read').forEach((button) => {
        button.addEventListener('click', async () => {
            button.disabled = true;
            try {
                await updateDoc(
                    doc(db, 'inboxMessages', button.dataset.messageId),
                    {
                        read: true,
                    }
                );
            } catch (error) {
                console.error('Could not mark inbox message as read:', error);
                button.disabled = false;
                let status = button.parentElement.querySelector(
                    '.inbox-action-error'
                );
                if (!status) {
                    status = document.createElement('p');
                    status.className = 'inbox-action-error';
                    status.setAttribute('role', 'status');
                    button.insertAdjacentElement('afterend', status);
                }
                status.textContent = firestoreErrorMessage(error);
            }
        });
    });
}

function firestoreErrorMessage(error) {
    const code = error?.code || '';
    if (code.endsWith('permission-denied')) {
        return 'Firestore rules denied this action. Publish the inbox rules from NOTES.md, including recipient read updates.';
    }
    if (code.endsWith('failed-precondition')) {
        return 'Firestore needs a one-time index for recipient email and message date. Create it, then wait for Firebase to finish building it.';
    }
    if (code.endsWith('unauthenticated')) {
        return 'Your sign-in expired. Sign in again and retry.';
    }
    if (code.endsWith('unavailable')) {
        return 'Inbox is offline right now. Check your connection and retry.';
    }
    if (code.endsWith('not-found')) {
        return 'This message no longer exists. Refresh the inbox and try again.';
    }
    return `Inbox request failed${code ? ` (${code})` : ''}. Check the browser console for details.`;
}
