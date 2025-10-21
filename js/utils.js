class Position {
    constructor(line = 1, column = 1) {
        this.line = line;
        this.column = column;
    }

    advance(char) {
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
    }

    clone() {
        return new Position(this.line, this.column);
    }
}

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

class Error {
    constructor(type, value, message, line, column) {
        this.type = type;
        this.value = value;
        this.message = message;
        this.line = line;
        this.column = column;
    }
}

// Constantes para tipos de tokens
const TOKEN_TYPES = {
    KEYWORD: 'PALABRA_RESERVADA',
    IDENTIFIER: 'IDENTIFICADOR',
    INTEGER: 'ENTERO',
    DECIMAL: 'DECIMAL',
    CHARACTER: 'CARACTER',
    STRING: 'CADENA',
    BOOLEAN: 'BOOLEANO',
    OPERATOR: 'OPERADOR',
    SEPARATOR: 'SEPARADOR',
    COMMENT: 'COMENTARIO'
};

// Palabras reservadas
const KEYWORDS = new Set([
    'public', 'class', 'static', 'void', 'main', 'String',
    'int', 'double', 'char', 'boolean', 'true', 'false',
    'if', 'else', 'for', 'while', 'System', 'out', 'println'
]);

// Operadores
const OPERATORS = new Set([
    '=', '+', '-', '*', '/', '==', '!=', '>', '<', '>=', '<=', '++', '--'
]);

// Separadores
const SEPARATORS = new Set([
    '{', '}', '(', ')', '[', ']', ';', ',', '.'
]);

// Función para crear elementos HTML
function createElement(tag, className, textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

// Función para descargar archivos
function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para limpiar tablas
function clearTables() {
    document.querySelectorAll('#tokens-table tbody, #lexical-errors-table tbody, #syntax-errors-table tbody').forEach(tbody => {
        tbody.innerHTML = '';
    });
}

// Función para mostrar resultados en tablas
function displayTokens(tokens) {
    const tbody = document.querySelector('#tokens-table tbody');
    tokens.forEach((token, index) => {
        const tr = createElement('tr');
        tr.appendChild(createElement('td', '', index + 1));
        tr.appendChild(createElement('td', '', token.value));
        tr.appendChild(createElement('td', '', token.type));
        tr.appendChild(createElement('td', '', token.line));
        tr.appendChild(createElement('td', '', token.column));
        tbody.appendChild(tr);
    });
    document.getElementById('token-count').textContent = `Tokens generados: ${tokens.length}`;
}

function displayLexicalErrors(errors) {
    const tbody = document.querySelector('#lexical-errors-table tbody');
    errors.forEach((error, index) => {
        const tr = createElement('tr');
        tr.appendChild(createElement('td', '', index + 1));
        tr.appendChild(createElement('td', '', error.value));
        tr.appendChild(createElement('td', '', error.message));
        tr.appendChild(createElement('td', '', error.line));
        tr.appendChild(createElement('td', '', error.column));
        tbody.appendChild(tr);
    });
}

function displaySyntaxErrors(errors) {
    const tbody = document.querySelector('#syntax-errors-table tbody');
    errors.forEach((error, index) => {
        const tr = createElement('tr');
        tr.appendChild(createElement('td', '', index + 1));
        tr.appendChild(createElement('td', '', error.value));
        tr.appendChild(createElement('td', '', error.message));
        tr.appendChild(createElement('td', '', error.line));
        tr.appendChild(createElement('td', '', error.column));
        tbody.appendChild(tr);
    });
}