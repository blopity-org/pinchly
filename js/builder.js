// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

import { query, renderHtml, escapeHtml } from './utils.js';

const templates = {
    blank: {
        body: '<mwk_text>Write your app content here.</mwk_text>',
        css: '',
    },
    calculator: {
        body: "<mwk_text>Enter two values and calculate.</mwk_text><div class='mwk-grid-2'><div class='mwk-card-panel'><div class='mwk-field'><label for='__mwk_input1'>Value A</label><input class='mwk-input' id='__mwk_input1' name='__mwk_input1' type='number'></div><div class='mwk-field'><label for='__mwk_input2'>Value B</label><input class='mwk-input' id='__mwk_input2' name='__mwk_input2' type='number'></div><mwk_submit label='Add values'></mwk_submit><div class='mwk-output' id='mwkDocFooter'>Result appears here.</div></div></div>'",
        css: '.mwk-card-panel { background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(45, 212, 191, 0.12)); }',
    },
    periodic: {
        body: "<div class='periodic-grid'><button class='periodic-element' data-name='Hydrogen' data-info='Hydrogen is the lightest element.'>H</button><button class='periodic-element' data-name='Oxygen' data-info='Oxygen is essential for life.'>O</button><button class='periodic-element' data-name='Gold' data-info='Gold is a precious metal used in jewelry.'>Au</button></div><div class='periodic-detail' id='periodic-detail'></div>'",
        css: '.periodic-grid { grid-template-columns: repeat(6, minmax(36px, 1fr)); }',
    },
};

function safeQuery(id) {
    return query(id);
}

function applyTemplate(name) {
    const template = templates[name] || templates.blank;
    safeQuery('#bodyHtml').value = template.body;
    safeQuery('#styleCss').value = template.css;
}

function buildAppObject() {
    return {
        name: safeQuery('#appTitle').value || 'My app',
        emoji: safeQuery('#appEmoji').value || '🧩',
        title: safeQuery('#appTitle').value || 'My app',
        subtitle: safeQuery('#appSubtitle').value || 'Built with Micro Web Kit',
        thumbnail: 'media/favicon.ico',
        theme: {
            accent: safeQuery('#accentColor').value,
            surface: '#ffffffee',
            background: '#f7f8ff',
            text: '#132238',
            border: '#dfe7f0',
        },
        body: safeQuery('#bodyHtml').value,
        styles: safeQuery('#styleCss').value || '',
    };
}

function generateJson() {
    const appObject = buildAppObject();
    const snippet = `"${safeQuery('#appName').value || '__mwk_custom_app'}": ${JSON.stringify(appObject, null, 2)}`;
    safeQuery('#jsonOutput').value = snippet;
    renderHtml(
        safeQuery('#builderStatus'),
        'JSON generated. Paste it into the apps object in data.json.'
    );
    localStorage.setItem(
        'mwk-builder-draft',
        JSON.stringify({
            appName: safeQuery('#appName').value,
            appEmoji: safeQuery('#appEmoji').value,
            appTitle: safeQuery('#appTitle').value,
            appSubtitle: safeQuery('#appSubtitle').value,
            accentColor: safeQuery('#accentColor').value,
            bodyHtml: safeQuery('#bodyHtml').value,
            styleCss: safeQuery('#styleCss').value,
            template: safeQuery('#template').value,
        })
    );
}

function copyJson() {
    navigator.clipboard.writeText(safeQuery('#jsonOutput').value).then(() => {
        renderHtml(safeQuery('#builderStatus'), 'Copied to clipboard.');
    });
}

export function initBuilderPage() {
    const templateSelect = safeQuery('#template');
    const generateBtn = safeQuery('#generateBtn');
    const copyBtn = safeQuery('#copyBtn');
    if (!templateSelect || !generateBtn || !copyBtn) return;

    templateSelect.addEventListener('change', () =>
        applyTemplate(templateSelect.value)
    );
    generateBtn.addEventListener('click', generateJson);
    copyBtn.addEventListener('click', copyJson);

    const draft = localStorage.getItem('mwk-builder-draft');
    if (draft) {
        const parsed = JSON.parse(draft);
        safeQuery('#appName').value =
            parsed.appName || safeQuery('#appName').value;
        safeQuery('#appEmoji').value =
            parsed.appEmoji || safeQuery('#appEmoji').value;
        safeQuery('#appTitle').value =
            parsed.appTitle || safeQuery('#appTitle').value;
        safeQuery('#appSubtitle').value =
            parsed.appSubtitle || safeQuery('#appSubtitle').value;
        safeQuery('#accentColor').value =
            parsed.accentColor || safeQuery('#accentColor').value;
        safeQuery('#bodyHtml').value =
            parsed.bodyHtml || safeQuery('#bodyHtml').value;
        safeQuery('#styleCss').value =
            parsed.styleCss || safeQuery('#styleCss').value;
        templateSelect.value = parsed.template || templateSelect.value;
    } else {
        applyTemplate(templateSelect.value);
    }
}
