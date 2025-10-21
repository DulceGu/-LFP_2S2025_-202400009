class Lexer {
    constructor(input) {
        this.input = input;
        this.position = new Position();
        this.currentChar = input.length > 0 ? input[0] : null;
        this.tokens = [];
        this.errors = [];
    }

    advance() {
        this.position.advance(this.currentChar);
        const index = this.getIndex();
        this.currentChar = index < this.input.length ? this.input[index] : null;
    }

    getIndex() {
        let line = 1;
        let col = 1;
        
        for (let i = 0; i < this.input.length; i++) {
            if (line === this.position.line && col === this.position.column) {
                return i;
            }
            
            if (this.input[i] === '\n') {
                line++;
                col = 1;
            } else {
                col++;
            }
        }
        
        return this.input.length;
    }

    skipWhitespace() {
        while (this.currentChar !== null && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }

    skipComment() {
        const startPosition = this.position.clone();
        
        // Comentario de línea
        if (this.currentChar === '/' && this.peek() === '/') {
            this.advance(); // Primer /
            this.advance(); // Segundo /
            
            let comment = '';
            while (this.currentChar !== null && this.currentChar !== '\n') {
                comment += this.currentChar;
                this.advance();
            }
            
            this.tokens.push(new Token(
                TOKEN_TYPES.COMMENT,
                '//' + comment,
                startPosition.line,
                startPosition.column
            ));
            
            return true;
        }
        
        // Comentario de bloque
        if (this.currentChar === '/' && this.peek() === '*') {
            this.advance(); // /
            this.advance(); // *
            
            let comment = '';
            while (this.currentChar !== null && !(this.currentChar === '*' && this.peek() === '/')) {
                comment += this.currentChar;
                this.advance();
                
                if (this.currentChar === null) {
                    this.errors.push(new Error(
                        'LÉXICO',
                        '/*' + comment,
                        'Comentario de bloque no cerrado',
                        startPosition.line,
                        startPosition.column
                    ));
                    return true;
                }
            }
            
            if (this.currentChar === '*' && this.peek() === '/') {
                this.advance(); // *
                this.advance(); // /
                
                this.tokens.push(new Token(
                    TOKEN_TYPES.COMMENT,
                    '/*' + comment + '*/',
                    startPosition.line,
                    startPosition.column
                ));
            }
            
            return true;
        }
        
        return false;
    }

    peek() {
        const index = this.getIndex() + 1;
        return index < this.input.length ? this.input[index] : null;
    }

    getNumber() {
        let number = '';
        const startPosition = this.position.clone();
        let isDecimal = false;

        while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
            number += this.currentChar;
            this.advance();
        }

        if (this.currentChar === '.') {
            isDecimal = true;
            number += this.currentChar;
            this.advance();

            while (this.currentChar !== null && /[0-9]/.test(this.currentChar)) {
                number += this.currentChar;
                this.advance();
            }

            // Verificar si hay más de un punto decimal
            if (this.currentChar === '.') {
                this.errors.push(new Error(
                    'LÉXICO',
                    number + this.currentChar,
                    'Número decimal inválido',
                    startPosition.line,
                    startPosition.column
                ));
                return null;
            }
        }

        if (isDecimal) {
            return new Token(
                TOKEN_TYPES.DECIMAL,
                number,
                startPosition.line,
                startPosition.column
            );
        } else {
            return new Token(
                TOKEN_TYPES.INTEGER,
                number,
                startPosition.line,
                startPosition.column
            );
        }
    }

    getString() {
        let str = '';
        const startPosition = this.position.clone();
        this.advance(); // Saltar la comilla inicial

        while (this.currentChar !== null && this.currentChar !== '"') {
            if (this.currentChar === '\\') {
                // Manejar caracteres de escape
                this.advance();
                if (this.currentChar === null) break;
                
                switch (this.currentChar) {
                    case 'n': str += '\n'; break;
                    case 't': str += '\t'; break;
                    case 'r': str += '\r'; break;
                    case '"': str += '"'; break;
                    case '\\': str += '\\'; break;
                    default: str += '\\' + this.currentChar; break;
                }
            } else {
                str += this.currentChar;
            }
            this.advance();
        }

        if (this.currentChar === '"') {
            this.advance(); // Saltar la comilla final
            return new Token(
                TOKEN_TYPES.STRING,
                str,
                startPosition.line,
                startPosition.column
            );
        } else {
            this.errors.push(new Error(
                'LÉXICO',
                '"' + str,
                'Cadena sin cerrar',
                startPosition.line,
                startPosition.column
            ));
            return null;
        }
    }

    getCharacter() {
        let char = '';
        const startPosition = this.position.clone();
        this.advance(); // Saltar la comilla simple inicial

        if (this.currentChar === '\\') {
            // Manejar caracteres de escape
            this.advance();
            if (this.currentChar === null) {
                this.errors.push(new Error(
                    'LÉXICO',
                    "'\\",
                    'Carácter mal formado',
                    startPosition.line,
                    startPosition.column
                ));
                return null;
            }
            
            switch (this.currentChar) {
                case 'n': char = '\n'; break;
                case 't': char = '\t'; break;
                case 'r': char = '\r'; break;
                case "'": char = "'"; break;
                case '\\': char = '\\'; break;
                default: char = '\\' + this.currentChar; break;
            }
            this.advance();
        } else {
            if (this.currentChar === null) {
                this.errors.push(new Error(
                    'LÉXICO',
                    "'",
                    'Carácter mal formado',
                    startPosition.line,
                    startPosition.column
                ));
                return null;
            }
            
            char = this.currentChar;
            this.advance();
        }

        if (this.currentChar === "'") {
            this.advance(); // Saltar la comilla simple final
            return new Token(
                TOKEN_TYPES.CHARACTER,
                char,
                startPosition.line,
                startPosition.column
            );
        } else {
            this.errors.push(new Error(
                'LÉXICO',
                "'" + char + (this.currentChar || ''),
                'Carácter mal formado',
                startPosition.line,
                startPosition.column
            ));
            return null;
        }
    }

    getIdentifierOrKeyword() {
        let id = '';
        const startPosition = this.position.clone();

        while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
            id += this.currentChar;
            this.advance();
        }

        if (KEYWORDS.has(id)) {
            return new Token(
                TOKEN_TYPES.KEYWORD,
                id,
                startPosition.line,
                startPosition.column
            );
        } else if (id === 'true' || id === 'false') {
            return new Token(
                TOKEN_TYPES.BOOLEAN,
                id,
                startPosition.line,
                startPosition.column
            );
        } else {
            return new Token(
                TOKEN_TYPES.IDENTIFIER,
                id,
                startPosition.line,
                startPosition.column
            );
        }
    }

    getOperator() {
        const startPosition = this.position.clone();
        let op = this.currentChar;

        // Operadores de dos caracteres
        const twoCharOps = ['==', '!=', '>=', '<=', '++', '--'];
        
        if (twoCharOps.includes(this.currentChar + (this.peek() || ''))) {
            op += this.peek();
            this.advance(); // Primer carácter
            this.advance(); // Segundo carácter
        } else {
            this.advance(); // Operador de un carácter
        }

        return new Token(
            TOKEN_TYPES.OPERATOR,
            op,
            startPosition.line,
            startPosition.column
        );
    }

    tokenize() {
        this.tokens = [];
        this.errors = [];
        this.position = new Position();

        const index = this.getIndex();
        this.currentChar = index < this.input.length ? this.input[index] : null;

        while (this.currentChar !== null) {
            // Saltar espacios en blanco
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }

            // Manejar comentarios
            if (this.currentChar === '/' && (this.peek() === '/' || this.peek() === '*')) {
                if (this.skipComment()) continue;
            }

            // Números
            if (/[0-9]/.test(this.currentChar)) {
                const token = this.getNumber();
                if (token) this.tokens.push(token);
                continue;
            }

            // Cadenas
            if (this.currentChar === '"') {
                const token = this.getString();
                if (token) this.tokens.push(token);
                continue;
            }

            // Caracteres
            if (this.currentChar === "'") {
                const token = this.getCharacter();
                if (token) this.tokens.push(token);
                continue;
            }

            // Identificadores y palabras reservadas
            if (/[a-zA-Z_]/.test(this.currentChar)) {
                const token = this.getIdentifierOrKeyword();
                this.tokens.push(token);
                continue;
            }

            // Operadores
            if (OPERATORS.has(this.currentChar)) {
                const token = this.getOperator();
                this.tokens.push(token);
                continue;
            }

            // Separadores
            if (SEPARATORS.has(this.currentChar)) {
                const token = new Token(
                    TOKEN_TYPES.SEPARATOR,
                    this.currentChar,
                    this.position.line,
                    this.position.column
                );
                this.tokens.push(token);
                this.advance();
                continue;
            }

            // Carácter no reconocido
            this.errors.push(new Error(
                'LÉXICO',
                this.currentChar,
                'Carácter no reconocido',
                this.position.line,
                this.position.column
            ));
            this.advance();
        }

        return {
            tokens: this.tokens,
            errors: this.errors
        };
    }
}