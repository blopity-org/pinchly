// Copyright © 2026 GreatCoder1000. All Rights Reserved.
// This source code may not be copied, modified, or redistributed
// without permission.

import { query } from './utils.js';

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

    if (trimmed in runtime) {
        return runtime[trimmed];
    }

    if (isNumeric(trimmed)) {
        return Number(trimmed);
    }

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

export function runCommandWithRuntime(command, runtime) {
    const parts = command.trim().split(/\s+/);
    const handler = MWK_COMMAND_HANDLERS[parts[0]];
    if (!handler) {
        throw new Error('Unexpected command: ' + command);
    }
    handler(parts, runtime);
}

export function mwkSubmitButtonClicked(appMwk) {
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

export function transformMwkMarkup(bodyHTML) {
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
            attrs.match(/label="([^\"]+)"/i) || attrs.match(/label='([^']+)'/i);
        const label = labelMatch ? labelMatch[1] : 'Submit';
        return `<button id="mwkSubmitBtn" class="btn-primary" type="button">${label}</button>`;
    });
    return out;
}
