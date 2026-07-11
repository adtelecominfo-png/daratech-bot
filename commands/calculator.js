// Calculator command -- common across most WhatsApp bot collections
// (e.g. simple `.calc`/`.calculate` utilities). Implemented from scratch
// using a small safe arithmetic evaluator (no external deps, no `eval`).

// Supports + - * / % ^ ( ) and decimals only. Rejects anything else.
function safeEvaluate(expression) {
    const sanitized = expression.replace(/\s+/g, '');
    if (sanitized.length > 100) {
        throw new Error('Expression too long.');
    }
    if (!/^[0-9.+\-*/%^()]+$/.test(sanitized)) {
        throw new Error('Expression contains unsupported characters.');
    }
    // Cap operator/paren count too -- a whitelist alone still lets someone
    // send something like a deeply nested "((((1))))" or a long exponent
    // chain that's cheap to type but expensive to evaluate.
    const opCount = (sanitized.match(/[+\-*/%^()]/g) || []).length;
    if (opCount > 40) {
        throw new Error('Expression too complex.');
    }
    // Convert ^ to ** for exponentiation, then evaluate via Function
    // constructor restricted to arithmetic-only input validated above.
    const jsExpr = sanitized.replace(/\^/g, '**');
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${jsExpr});`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('Invalid result.');
    }
    return result;
}

async function calculatorCommand(sock, chatId, message, expression) {
    const expr = (expression || '').trim();
    if (!expr) {
        return sock.sendMessage(chatId, {
            text: '🧮 *Calculator*\n\nUsage: *.calc <expression>*\nSupports + - * / % ^ ( )\n\nExample:\n.calc (5 + 3) * 2 ^ 2'
        }, { quoted: message });
    }
    try {
        const result = safeEvaluate(expr);
        return sock.sendMessage(chatId, { text: `🧮 *${expr}* = *${result}*` }, { quoted: message });
    } catch {
        return sock.sendMessage(chatId, { text: '⚠️ Invalid expression. Use only numbers and + - * / % ^ ( ).' }, { quoted: message });
    }
}

module.exports = { calculatorCommand };
