// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

/*
 * Pinchly app loader and runtime utilities.
 *
 * This file is now modularized so each helper serves a single purpose.
 */

const STORAGE_KEYS = {
    auth: 'pinchly-firebase-user',
    appPrefix: 'pinchly:app:',
};

const SELECTORS = {
    authBar: '#auth-bar',
    appContainer: '#app-container',
    authStatus: '#authStatus',
};

const ICONS = {
    user: 'fa-user',
    terminal: 'fa-terminal',
    code: 'fa-code',
    database: 'fa-database',
    info: 'fa-circle-info',
};

function query(selector) {
    return document.querySelector(selector);
}

function queryAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function renderHtml(target, html) {
    if (!target) return;
    target.innerHTML = html;
}

function createIcon(name, label = '') {
    const title = label ? ` title="${escapeHtml(label)}"` : '';
    return `<i class="fa-solid ${name}" aria-hidden="true"${title}></i>`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getUrlParamsManual() {
    const params = {};
    const query = window.location.search.replace(/^\?/, '');
    query.split('&').forEach((entry) => {
        if (!entry) return;
        const [key, value] = entry.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
    return params;
}

function getCurrentUser() {
    return localStorage.getItem(STORAGE_KEYS.auth);
}

function isUserSignedIn() {
    return Boolean(getCurrentUser());
}

function getAppStorageKey(appId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    return `${STORAGE_KEYS.appPrefix}${currentUser}:${appId}:data`;
}

function loadAppData(appId, defaultData = {}) {
    const storageKey = getAppStorageKey(appId);
    if (!storageKey) {
        return structuredClone(defaultData);
    }

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return structuredClone(defaultData);
        return JSON.parse(raw);
    } catch {
        return structuredClone(defaultData);
    }
}

function saveAppData(appId, data) {
    const storageKey = getAppStorageKey(appId);
    if (!storageKey) return false;

    try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

function createAppInfoPanel() {
    if (!isUserSignedIn()) {
        return `<p class="mwk-tip">${createIcon(ICONS.info, 'Tip')} Sign in to save app state and continue your work later.</p>`;
    }
    const accountLabel =
        localStorage.getItem('pinchly-current-user-label') || 'your account';
    return `<p class="mwk-tip">${createIcon(ICONS.user, 'Account')} Welcome back, ${escapeHtml(accountLabel)}. Your saved data is available on this device.</p>`;
}

function createAppHeader(title, subtitle) {
    return `
        <div class="app-header">
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p class="app-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <div class="app-badge-row">
            <a class="back-link" href="apps.html?app=__mwk_root">${createIcon('fa-arrow-left', 'Back')} Back to library</a>
            ${createAppInfoPanel()}
        </div>
    `;
}

function renderSectionHeader(title, description) {
    return `
        <div class="section-header">
            <h2>${createIcon(ICONS.info, title)} ${escapeHtml(title)}</h2>
            ${description ? `<p class="mwk-tip">${escapeHtml(description)}</p>` : ''}
        </div>
    `;
}

function renderAppStorageSection(appId, appMwk, storageData) {
    const hasStorage = Boolean(
        appMwk.data ||
        appMwk.allowStorage ||
        appMwk.type === 'json' ||
        appMwk.codeEditor ||
        appMwk.cli
    );
    if (!hasStorage) return '';

    const isEditable = isUserSignedIn();
    const preview = escapeHtml(JSON.stringify(storageData, null, 2));

    return `
        <section class="mwk-section json-storage-panel">
            ${renderSectionHeader(
                'App JSON Data',
                isEditable
                    ? 'Save your structured app data for this account.'
                    : 'Login to save changes locally and revisit them later.'
            )}
            <textarea id="appDataEditor" ${isEditable ? '' : 'disabled'} aria-label="App JSON data editor">${preview}</textarea>
            <div class="builder-actions">
                <button class="btn-primary" id="saveAppDataBtn" type="button" ${isEditable ? '' : 'disabled'}>${createIcon(ICONS.database, 'Save')} Save app data</button>
                <button class="btn-secondary" id="resetAppDataBtn" type="button">Reset preview</button>
            </div>
        </section>
    `;
}

function renderAppCodeEditorSection(appMwk) {
    const defaultCode = `// Write a JS expression or function here
const current = storage || {}
const next = {...current, hits: (current.hits || 0) + 1}
setStorage(next)
return 'Storage saved: ' + next.hits`;
    const code = escapeHtml(appMwk.javascript || appMwk.editor || defaultCode);

    return `
        <section class="mwk-section code-editor-panel">
            ${renderSectionHeader('JS Coding Interface', 'Use storage, data, and user in live code to shape this app.')}
            <textarea id="appCodeEditor" aria-label="JavaScript editor">${code}</textarea>
            <div class="builder-actions">
                <button class="btn-primary" id="runAppCodeBtn" type="button">${createIcon(ICONS.code, 'Run code')} Run code</button>
            </div>
            <div class="mwk-output" id="codeRunnerOutput" role="status">Code output appears here.</div>
        </section>
    `;
}

function renderCliSection(appMwk) {
    if (!appMwk.cli && appMwk.type !== 'cli') return '';

    return `
        <section class="mwk-section cli-terminal">
            ${renderSectionHeader('Terminal CLI', 'Try help, echo, json, get, set, and clear commands.')}
            <div class="cli-output" id="cliOutput" aria-live="polite"></div>
            <div class="cli-input-row">
                <label class="sr-only" for="cliInput">CLI command</label>
                <input id="cliInput" class="mwk-input" type="text" placeholder="Type a command..." aria-label="CLI command input">
                <button class="btn-primary" id="cliSendBtn" type="button">Send</button>
            </div>
        </section>
    `;
}

function applyAppTheme(theme = {}) {
    const card = query('.card');
    if (!card) return;

    card.style.setProperty('--mwk-accent', theme.accent || '#009654');
    card.style.setProperty('--mwk-surface', theme.surface || '#ffffffee');
    card.style.setProperty('--mwk-bg', theme.background || '#f6fbff');
    card.style.setProperty('--mwk-text', theme.text || '#18212f');
    card.style.setProperty('--mwk-border', theme.border || '#dfe7f0');
}

function applyAppStyles(cssText) {
    const styleEl = query('#mwk-app-style');
    if (styleEl) styleEl.remove();
    if (!cssText) return;

    const newStyle = document.createElement('style');
    newStyle.id = 'mwk-app-style';
    newStyle.textContent = cssText;
    document.head.appendChild(newStyle);
}

function loadApp(appMwk, appId, appData) {
    const appCntr = query(SELECTORS.appContainer);
    if (!appCntr) return;

    applyAppTheme(appMwk.theme);

    const storageData = loadAppData(appId, appMwk.data || {});
    const shouldShowStorage = Boolean(
        appMwk.data ||
        appMwk.allowStorage ||
        appMwk.type === 'json' ||
        appMwk.codeEditor ||
        appMwk.cli
    );

    const bodyHTML = transformMwkMarkup(appMwk.body || '');
    const footerHTML =
        !appMwk.body || !appMwk.body.includes('<mwk_output')
            ? '<div id="mwkDocFooter" class="mwk-output"></div>'
            : '';

    renderHtml(
        appCntr,
        `
        ${createAppHeader(
            `${appMwk.emoji ? appMwk.emoji + ' ' : ''}${appMwk.title || appMwk.name || 'Untitled app'}`,
            appMwk.subtitle || ''
        )}
        <div class="app-body">${bodyHTML}</div>
        ${footerHTML}
        ${renderCliSection(appMwk)}
        ${appMwk.codeEditor || appMwk.javascript ? renderAppCodeEditorSection(appMwk) : ''}
        ${shouldShowStorage ? renderAppStorageSection(appId, appMwk, storageData) : ''}
    `
    );

    if (appMwk.styles) {
        applyAppStyles(appMwk.styles);
    }

    bindAppEvents(appId, appMwk);
}

function bindAppEvents(appId, appMwk) {
    bindSubmitButton(appMwk);
    bindCliControls(appId, appMwk);
    bindCodeEditor(appId, appMwk);
    bindStorageControls(appId, appMwk);
    enhanceInteractiveElements(appMwk);
}

function bindSubmitButton(appMwk) {
    const submitButton = query('#mwkSubmitBtn');
    if (!submitButton || !appMwk.scripts) return;
    submitButton.addEventListener('click', () =>
        mwkSubmitButtonClicked(appMwk)
    );
}

function bindCliControls(appId, appMwk) {
    const cliOutput = query('#cliOutput');
    const cliInput = query('#cliInput');
    const cliSend = query('#cliSendBtn');
    if (!cliOutput || !cliInput || !cliSend) return;

    appendCliLine(
        cliOutput,
        appMwk.cliIntro ||
            'Welcome to the Blopity Pinch command line. Type help to get started.',
        'info'
    );

    cliSend.addEventListener('click', () => {
        const command = cliInput.value.trim();
        if (!command) return;
        appendCliLine(cliOutput, `> ${command}`, 'command');
        runCliCommand(appId, appMwk, command, cliOutput);
        cliInput.value = '';
    });

    cliInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            cliSend.click();
        }
    });
}

function bindCodeEditor(appId, appMwk) {
    const runButton = query('#runAppCodeBtn');
    const codeEditor = query('#appCodeEditor');
    const output = query('#codeRunnerOutput');
    if (!runButton || !codeEditor || !output) return;

    runButton.addEventListener('click', () => {
        try {
            const storage = loadAppData(appId, appMwk.data || {});
            const result = Function(
                'storage',
                'data',
                'user',
                'setStorage',
                codeEditor.value
            )(
                structuredClone(storage),
                appMwk.data || {},
                getCurrentUser(),
                (updatedStorage) => {
                    if (saveAppData(appId, updatedStorage)) {
                        output.textContent = 'Storage saved.';
                    }
                }
            );
            output.textContent =
                typeof result === 'undefined'
                    ? 'Code executed.'
                    : String(result);
        } catch (error) {
            output.textContent = `Runtime error: ${error.message}`;
        }
    });
}

function bindStorageControls(appId, appMwk) {
    const saveButton = query('#saveAppDataBtn');
    const resetButton = query('#resetAppDataBtn');

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const dataEditor = query('#appDataEditor');
            if (!dataEditor) return;

            const status =
                query(SELECTORS.authStatus) || document.createElement('span');
            try {
                const parsed = JSON.parse(dataEditor.value);
                const saved = saveAppData(appId, parsed);
                status.textContent = saved
                    ? 'Data saved locally for this app.'
                    : 'Unable to save data.';
                if (status.id !== 'authStatus') {
                    status.className = 'auth-status';
                    dataEditor.insertAdjacentElement('afterend', status);
                }
            } catch (error) {
                status.textContent = 'JSON parse error: ' + error.message;
            }
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            const dataEditor = query('#appDataEditor');
            if (!dataEditor) return;
            dataEditor.value = JSON.stringify(
                loadAppData(appId, appMwk.data || {}),
                null,
                2
            );
        });
    }
}

function appendCliLine(outputElement, text, type = 'output') {
    const line = document.createElement('div');
    line.className = `cli-line cli-line-${type}`;
    line.textContent = text;
    outputElement.appendChild(line);
    outputElement.scrollTop = outputElement.scrollHeight;
}

function parseCliValue(value) {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
}

function runCliCommand(appId, appMwk, input, outputElement) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const storage = loadAppData(appId, appMwk.data || {});

    switch (command) {
        case 'help':
            appendCliLine(
                outputElement,
                'Commands: help, echo, json, show data, get <key>, set <key> <value>, clear',
                'info'
            );
            break;
        case 'echo':
            appendCliLine(outputElement, args.join(' ') || '', 'output');
            break;
        case 'json':
            appendCliLine(
                outputElement,
                JSON.stringify(storage, null, 2),
                'output'
            );
            break;
        case 'show':
            if (args[0] === 'data') {
                appendCliLine(
                    outputElement,
                    JSON.stringify(storage, null, 2),
                    'output'
                );
            } else {
                appendCliLine(outputElement, 'Usage: show data', 'error');
            }
            break;
        case 'get':
            if (!args.length) {
                appendCliLine(outputElement, 'Usage: get <key>', 'error');
                break;
            }
            appendCliLine(
                outputElement,
                JSON.stringify(storage[args[0]], null, 2),
                'output'
            );
            break;
        case 'set':
            if (args.length < 2) {
                appendCliLine(
                    outputElement,
                    'Usage: set <key> <value>',
                    'error'
                );
                break;
            }
            const key = args[0];
            const value = parseCliValue(args.slice(1).join(' '));
            storage[key] = value;
            if (saveAppData(appId, storage)) {
                appendCliLine(outputElement, `Saved ${key}.`, 'info');
            } else {
                appendCliLine(
                    outputElement,
                    'Login to save data locally.',
                    'error'
                );
            }
            break;
        case 'clear':
            outputElement.innerHTML = '';
            break;
        default:
            appendCliLine(
                outputElement,
                `Unknown command: ${command}. Type help.`,
                'error'
            );
    }
}

function getAppFromData(appId, appData) {
    return (
        appData.apps[appId] ||
        appData.folders[appId] ||
        appData.apps['__mwk_404']
    );
}

function loadFolder(folderMwk, appData) {
    const appCntr = query(SELECTORS.appContainer);
    if (!appCntr) return;
    renderHtml(
        appCntr,
        `
        <div class="app-header">
            <h1>${escapeHtml(folderMwk.emoji || '📁')} ${escapeHtml(folderMwk.name)}</h1>
            <p class="app-subtitle">A collection of small tools</p>
        </div>
        <a class="back-link" href="apps.html?app=${folderMwk.parent || '__mwk_root'}">Back</a>
        ${renderAppList(folderMwk.children, appData)}
    `
    );
}

function loadRoot(folderMwk, appData) {
    const appCntr = query(SELECTORS.appContainer);
    if (!appCntr) return;
    renderHtml(
        appCntr,
        `
        <div class="app-header">
            <h1>Blopity Pinch</h1>
            <p class="app-subtitle">Small tools, useful experiments, and things that just work.</p>
        </div>
        ${renderAppList(folderMwk.children, appData)}
    `
    );
}

function renderAppList(appIds, appData) {
    const links = appIds
        .map((childApp) => {
            const childAppData = getAppFromData(childApp, appData);
            return `<li><a href="apps.html?app=${childApp}">${childAppData.emoji ? childAppData.emoji + ' ' : ''}${escapeHtml(childAppData.name || childAppData.title)}</a></li>`;
        })
        .join('');
    return `<ul class="app-ul">${links}</ul>`;
}

function transformMwkMarkup(bodyHTML) {
    let out = bodyHTML || '';
    const rules = [
        { from: /<mwk_text([^>]*)>/gi, to: '<div class="mwk-text"$1>' },
        { from: /<\/mwk_text>/gi, to: '</div>' },
        {
            from: /<mwk_section([^>]*)>/gi,
            to: '<section class="mwk-section"$1>',
        },
        { from: /<\/mwk_section>/gi, to: '</section>' },
        { from: /<mwk_row([^>]*)>/gi, to: '<div class="mwk-row"$1>' },
        { from: /<\/mwk_row>/gi, to: '</div>' },
    ];
    rules.forEach(({ from, to }) => {
        out = out.replace(from, to);
    });
    out = out.replace(/<mwk_input(\d+)>/gi, (match, num) => {
        const id = '__mwk_input' + num;
        return `<input class="mwk-input" type="text" id="${id}" name="${id}">`;
    });
    out = out.replace(/<mwk_output([^>]*)>/gi, (match, attrs) => {
        return `<div class="mwk-output"${attrs || ''}></div>`;
    });
    out = out.replace(/<mwk_submit([^>]*)>/gi, (match, attrs) => {
        const labelMatch =
            attrs.match(/label="([^"]+)"/i) || attrs.match(/label='([^']+)'/i);
        const label = labelMatch ? labelMatch[1] : 'Submit';
        return `<button id="mwkSubmitBtn" class="btn-primary" type="button">${escapeHtml(label)}</button>`;
    });
    return out;
}

function isNumeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function evalToken(token, runtime) {
    const trimmed = String(token).trim();
    if (isNumeric(trimmed)) return Number(trimmed);
    if (trimmed.startsWith('__mwk_input')) {
        const el = query(`#${trimmed}`);
        if (!el) return NaN;
        const value = el.value;
        return isNumeric(value) ? Number(value) : NaN;
    }
    if (trimmed in runtime) return Number(runtime[trimmed]);
    return NaN;
}

function calculateExpression(expr, runtime) {
    const cleanExpr = String(expr).trim().replace(/\^/g, '**');
    const compiled = cleanExpr.replace(/__mwk_[a-zA-Z0-9_]+/g, (token) => {
        const value = evalToken(token, runtime);
        return Number.isFinite(value) ? value : 0;
    });
    try {
        return Function('return ' + compiled)();
    } catch {
        return NaN;
    }
}

function calculateWithRuntime(calc, runtime) {
    const expr = calc.slice(1).join(' ');
    return calculateExpression(expr, runtime);
}

function resolveValue(rawValue, runtime) {
    const trimmed = String(rawValue).trim();
    if (!trimmed) return '';
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith('__mwk_calc')) {
        return calculateWithRuntime(trimmed.split(/\s+/), runtime);
    }
    if (trimmed.startsWith('__mwk_input')) {
        const el = query(`#${trimmed}`);
        return el ? el.value : '';
    }
    if (trimmed in runtime) return runtime[trimmed];
    if (isNumeric(trimmed)) return Number(trimmed);
    return trimmed;
}

const MWK_COMMAND_HANDLERS = {
    __mwk_setvar: (parts, runtime) => {
        const varname = parts[1];
        const rawValue = parts.slice(2).join(' ');
        const value = rawValue.startsWith('__mwk_calc')
            ? calculateWithRuntime(parts.slice(2), runtime)
            : resolveValue(rawValue, runtime);
        runtime[varname] = value;
    },
    __mwk_settext: (parts, runtime) => {
        const target = parts[1];
        const value = resolveValue(parts.slice(2).join(' '), runtime);
        const el = query(`#${target}`);
        if (el) el.textContent = value;
    },
    __mwk_sethtml: (parts, runtime) => {
        const target = parts[1];
        const value = resolveValue(parts.slice(2).join(' '), runtime);
        const el = query(`#${target}`);
        if (el) el.innerHTML = value;
    },
    __mwk_setstyle: (parts) => {
        const target = parts[1];
        const property = parts[2];
        const value = parts.slice(3).join(' ');
        const el = query(`#${target}`);
        if (el) el.style[property] = value;
    },
};

function runCommandWithRuntime(command, runtime) {
    const parts = command.trim().split(/\s+/);
    const handler = MWK_COMMAND_HANDLERS[parts[0]];
    if (!handler) {
        throw new Error('Unexpected command: ' + command);
    }
    handler(parts, runtime);
}

function mwkSubmitButtonClicked(appMwk) {
    if (!appMwk.scripts) return;

    Object.values(appMwk.scripts).forEach((script) => {
        if (!script.execute_on.includes('__mwk_submit')) return;
        const runtime = {};
        script.lines.forEach((line) => runCommandWithRuntime(line, runtime));
        const footer = query('#mwkDocFooter');
        if (footer) {
            footer.innerHTML = runtime.__mwk_doc_footer ?? '';
        }
    });
}

function enhanceInteractiveElements(appMwk) {
    queryAll('.periodic-element').forEach((button) => {
        button.addEventListener('click', () => {
            const detail = query('#periodic-detail');
            if (!detail) return;
            detail.innerHTML = `<h3>${escapeHtml(button.dataset.name || button.textContent)}</h3><p>${escapeHtml(button.dataset.info || 'Select any element for a quick fact.')}</p>`;
        });
    });
    if (appMwk.title === 'Periodic Table Explorer') {
        const detail = query('#periodic-detail');
        if (detail) {
            detail.innerHTML =
                '<h3>Periodic Table Explorer</h3><p>Click any element to reveal a fun fact.</p>';
        }
    }
}

function fetchAppData() {
    fetch('./data.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => afterLoad(data))
        .catch((error) => {
            console.error('Error fetching the file:', error);
        });
}

function afterLoad(appData) {
    const params = getUrlParamsManual();
    const appId = Object.keys(params).length === 0 ? '__mwk_root' : params.app;
    if (appId === '__mwk_root') {
        loadRoot(appData.folders['__mwk_root'], appData);
    } else if (appData.apps[appId]) {
        loadApp(appData.apps[appId], appId, appData);
    } else if (appData.folders[appId]) {
        loadFolder(appData.folders[appId], appId, appData);
    } else {
        loadApp(appData.apps['__mwk_404'], '__mwk_404', appData);
    }
}

if (query(SELECTORS.appContainer)) {
    fetchAppData();
    window.addEventListener('pinchly-auth-change', fetchAppData);
}

function appendCliLine(outputElement, text, type = 'output') {
    const line = document.createElement('div');
    line.className = `cli-line cli-line-${type}`;
    line.textContent = text;
    outputElement.appendChild(line);
    outputElement.scrollTop = outputElement.scrollHeight;
}

function parseCliValue(value) {
    const trimmed = value.trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (!Number.isNaN(Number(trimmed))) return Number(trimmed);
    try {
        return JSON.parse(trimmed);
    } catch {
        return trimmed;
    }
}

function runCliCommand(appId, appMwk, input, outputElement) {
    const parts = input.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    const storage = loadAppData(appId, appMwk.data || {});

    switch (command) {
        case 'help':
            appendCliLine(
                outputElement,
                'Commands: help, echo, json, show data, get <key>, set <key> <value>, clear',
                'info'
            );
            break;
        case 'echo':
            appendCliLine(outputElement, args.join(' ') || '', 'output');
            break;
        case 'json':
            appendCliLine(
                outputElement,
                JSON.stringify(storage, null, 2),
                'output'
            );
            break;
        case 'show':
            if (args[0] === 'data') {
                appendCliLine(
                    outputElement,
                    JSON.stringify(storage, null, 2),
                    'output'
                );
            } else {
                appendCliLine(outputElement, 'Usage: show data', 'error');
            }
            break;
        case 'get':
            if (!args.length) {
                appendCliLine(outputElement, 'Usage: get <key>', 'error');
                break;
            }
            appendCliLine(
                outputElement,
                JSON.stringify(storage[args[0]], null, 2),
                'output'
            );
            break;
        case 'set':
            if (args.length < 2) {
                appendCliLine(
                    outputElement,
                    'Usage: set <key> <value>',
                    'error'
                );
                break;
            }
            const key = args[0];
            const value = parseCliValue(args.slice(1).join(' '));
            storage[key] = value;
            if (saveAppData(appId, storage)) {
                appendCliLine(outputElement, `Saved ${key}.`, 'info');
            } else {
                appendCliLine(
                    outputElement,
                    'Login to save data locally.',
                    'error'
                );
            }
            break;
        case 'clear':
            outputElement.innerHTML = '';
            break;
        default:
            appendCliLine(
                outputElement,
                `Unknown command: ${command}. Type help.`,
                'error'
            );
    }
}

function loadFolder(folderMwk, appData) {
    const appCntr = document.getElementById('app-container');
    appCntr.innerHTML = '';
    appCntr.className = 'app-shell';
    appCntr.innerHTML += `<div class="app-header"><h1>${folderMwk.emoji || '📁'} ${folderMwk.name}</h1><p class="app-subtitle">A collection of small tools</p></div>`;
    appCntr.innerHTML += `<a class="back-link" href="apps.html?app=${folderMwk.parent || '__mwk_root'}">Back</a>`;
    appCntr.innerHTML += '<ul class="app-ul">';

    folderMwk.children.forEach((childApp) => {
        const childAppData = getAppFromData(childApp, appData);
        appCntr.innerHTML += `<li><a href="apps.html?app=${childApp}">${childAppData.emoji ? childAppData.emoji + ' ' : ''}${childAppData.name || childAppData.title}</a></li>`;
    });

    appCntr.innerHTML += '</ul>';
}

function loadRoot(folderMwk, appData) {
    const appCntr = document.getElementById('app-container');
    appCntr.innerHTML = '';
    appCntr.className = 'app-shell';
    appCntr.innerHTML +=
        '<div class="app-header"><h1>Blopity Pinch</h1><p class="app-subtitle">Small tools, useful experiments, and things that just work.</p></div>';
    appCntr.innerHTML += '<ul class="app-ul">';

    folderMwk.children.forEach((childApp) => {
        const childAppData = getAppFromData(childApp, appData);
        appCntr.innerHTML += `<li><a href="apps.html?app=${childApp}">${childAppData.emoji ? childAppData.emoji + ' ' : ''}${childAppData.name || childAppData.title}</a></li>`;
    });

    appCntr.innerHTML += '</ul>';
}

function transformMwkMarkup(bodyHTML) {
    let out = bodyHTML || '';

    out = out.replace(/<mwk_text([^>]*)>/gi, '<div class="mwk-text"$1>');
    out = out.replace(/<\/mwk_text>/gi, '</div>');
    out = out.replace(
        /<mwk_section([^>]*)>/gi,
        '<section class="mwk-section"$1>'
    );
    out = out.replace(/<\/mwk_section>/gi, '</section>');
    out = out.replace(/<mwk_row([^>]*)>/gi, '<div class="mwk-row"$1>');
    out = out.replace(/<\/mwk_row>/gi, '</div>');

    out = out.replace(/<mwk_input(\d+)>/gi, (match, num) => {
        const id = '__mwk_input' + num;
        return `<input class="mwk-input" type="text" id="${id}" name="${id}">`;
    });

    out = out.replace(/<mwk_output([^>]*)>/gi, (match, attrs) => {
        return `<div class="mwk-output"${attrs || ''}></div>`;
    });

    out = out.replace(/<mwk_submit([^>]*)>/gi, (match, attrs) => {
        const labelMatch =
            attrs.match(/label="([^"]+)"/i) || attrs.match(/label='([^']+)'/i);
        const label = labelMatch ? labelMatch[1] : 'Submit';
        return `<button id="mwkSubmitBtn" class="btn-primary" type="button">${label}</button>`;
    });

    return out;
}

function isNumeric(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
}

function evalToken(token, runtime) {
    const trimmed = String(token).trim();
    if (isNumeric(trimmed)) return Number(trimmed);

    if (trimmed.startsWith('__mwk_input')) {
        const el = document.getElementById(trimmed);
        if (!el) return NaN;
        const value = el.value;
        return isNumeric(value) ? Number(value) : NaN;
    }

    if (trimmed in runtime) return Number(runtime[trimmed]);

    return NaN;
}

function calculateExpression(expr, runtime) {
    const cleanExpr = String(expr).trim().replace(/\^/g, '**');

    const compiled = cleanExpr.replace(/__mwk_[a-zA-Z0-9_]+/g, (token) => {
        const value = evalToken(token, runtime);
        return Number.isFinite(value) ? value : 0;
    });

    try {
        return Function('return ' + compiled)();
    } catch {
        return NaN;
    }
}

function calculateWithRuntime(calc, runtime) {
    const expr = calc.slice(1).join(' ');
    return calculateExpression(expr, runtime);
}

function resolveValue(rawValue, runtime) {
    const trimmed = String(rawValue).trim();

    if (!trimmed) return '';
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }

    if (trimmed.startsWith('__mwk_calc')) {
        return calculateWithRuntime(trimmed.split(/\s+/), runtime);
    }

    if (trimmed.startsWith('__mwk_input')) {
        const el = document.getElementById(trimmed);
        return el ? el.value : '';
    }

    if (trimmed in runtime) {
        return runtime[trimmed];
    }

    if (isNumeric(trimmed)) {
        return Number(trimmed);
    }

    return trimmed;
}

function runCommandWithRuntime(command, runtime) {
    const parts = command.trim().split(/\s+/);
    const commandName = parts[0];

    if (commandName === '__mwk_setvar') {
        const varname = parts[1];
        const rawValue = parts.slice(2).join(' ');
        const value = rawValue.startsWith('__mwk_calc')
            ? calculateWithRuntime(parts.slice(2), runtime)
            : resolveValue(rawValue, runtime);
        runtime[varname] = value;
        return;
    }

    if (commandName === '__mwk_settext') {
        const target = parts[1];
        const value = resolveValue(parts.slice(2).join(' '), runtime);
        const el = document.getElementById(target);
        if (el) {
            el.textContent = value;
        }
        return;
    }

    if (commandName === '__mwk_sethtml') {
        const target = parts[1];
        const value = resolveValue(parts.slice(2).join(' '), runtime);
        const el = document.getElementById(target);
        if (el) {
            el.innerHTML = value;
        }
        return;
    }

    if (commandName === '__mwk_setstyle') {
        const target = parts[1];
        const property = parts[2];
        const value = parts.slice(3).join(' ');
        const el = document.getElementById(target);
        if (el) {
            el.style[property] = value;
        }
        return;
    }

    throw new Error('Unexpected command: ' + commandName);
}

function mwkSubmitButtonClicked(appMwk) {
    if (!appMwk.scripts) return;

    Object.keys(appMwk.scripts).forEach((scriptId) => {
        const script = appMwk.scripts[scriptId];
        if (script.execute_on.includes('__mwk_submit')) {
            const runtime = {};
            script.lines.forEach((line) => {
                runCommandWithRuntime(line, runtime);
            });

            const footer = document.getElementById('mwkDocFooter');
            if (footer) {
                footer.innerHTML = runtime.__mwk_doc_footer ?? '';
            }
        }
    });
}

function enhanceInteractiveElements(appMwk) {
    document.querySelectorAll('.periodic-element').forEach((button) => {
        button.addEventListener('click', () => {
            const detail = document.getElementById('periodic-detail');
            if (!detail) return;
            detail.innerHTML = `<h3>${button.dataset.name || button.textContent}</h3><p>${button.dataset.info || 'Select any element for a quick fact.'}</p>`;
        });
    });

    if (appMwk.title === 'Periodic Table Explorer') {
        const detail = document.getElementById('periodic-detail');
        if (detail) {
            detail.innerHTML =
                '<h3>Periodic Table Explorer</h3><p>Click any element to reveal a fun fact.</p>';
        }
    }
}

function fetchAppData() {
    fetch('./data.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then((data) => {
            afterLoad(data);
        })
        .catch((error) => {
            console.error('Error fetching the file:', error);
        });
}

if (document.getElementById('app-container')) {
    fetchAppData();
}
