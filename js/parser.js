class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
        this.errors = [];
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;
    }

    advance() {
        this.currentIndex++;
        this.currentToken = this.currentIndex < this.tokens.length ? 
            this.tokens[this.currentIndex] : null;
    }

    match(type, value = null) {
        if (this.currentToken && this.currentToken.type === type && 
            (value === null || this.currentToken.value === value)) {
            this.advance();
            return true;
        }
        return false;
    }

    expect(type, value = null) {
        if (this.match(type, value)) {
            return true;
        } else {
            const expected = value ? `${type} '${value}'` : type;
            const found = this.currentToken ? 
                `${this.currentToken.type} '${this.currentToken.value}'` : 'EOF';
            
            this.errors.push(new Error(
                'SINTÁCTICO',
                this.currentToken ? this.currentToken.value : 'EOF',
                `Se esperaba ${expected}, se encontró ${found}`,
                this.currentToken ? this.currentToken.line : 1,
                this.currentToken ? this.currentToken.column : 1
            ));
            return false;
        }
    }

    parse() {
        this.errors = [];
        this.currentIndex = 0;
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;

        if (!this.parseProgram()) {
            return { success: false, errors: this.errors };
        }

        // Verificar que no queden tokens sin procesar
        if (this.currentToken !== null) {
            this.errors.push(new Error(
                'SINTÁCTICO',
                this.currentToken.value,
                'Código adicional después del programa',
                this.currentToken.line,
                this.currentToken.column
            ));
            return { success: false, errors: this.errors };
        }

        return { success: this.errors.length === 0, errors: this.errors };
    }

    parseProgram() {
        // PROGRAMA ::= 'public' 'class' ID '{' MAIN '}'
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'public')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'class')) return false;
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
        if (!this.parseMain()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        
        return true;
    }

    parseMain() {
        // MAIN ::= 'public' 'static' 'void' 'main' '(' 'String' '[' ']' ID ')' '{' SENTENCIAS '}'
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'public')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'static')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'void')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'main')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '(')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'String')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '[')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ']')) return false;
        
        // CORRECCIÓN: args debe ser IDENTIFICADOR, no PALABRA_RESERVADA
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
        if (!this.parseSentencias()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        
        return true;
    }

    parseSentencias() {
        // SENTENCIAS ::= SENTENCIA SENTENCIAS | ε
        while (this.currentToken && 
               (this.currentToken.type !== TOKEN_TYPES.SEPARATOR || this.currentToken.value !== '}')) {
            
            // CORRECCIÓN: Saltar comentarios
            if (this.currentToken.type === TOKEN_TYPES.COMMENT) {
                this.advance();
                continue;
            }
            
            // CORRECCIÓN: Saltar punto y coma vacíos
            if (this.currentToken.type === TOKEN_TYPES.SEPARATOR && this.currentToken.value === ';') {
                this.advance();
                continue;
            }
            
            if (!this.parseSentencia()) {
                return false;
            }
        }
        return true;
    }

    parseSentencia() {
        // SENTENCIA ::= DECLARACION | ASIGNACION | IF | FOR | WHILE | PRINT | ';'
        
        // DECLARACION
        if (this.isType()) {
            return this.parseDeclaracion();
        }
        
        // ASIGNACION
        if (this.currentToken && this.currentToken.type === TOKEN_TYPES.IDENTIFIER && 
            this.peek() && this.peek().value === '=') {
            return this.parseAsignacion();
        }
        
        // IF
        if (this.currentToken && this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'if') {
            return this.parseIf();
        }
        
        // FOR
        if (this.currentToken && this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'for') {
            return this.parseFor();
        }
        
        // WHILE
        if (this.currentToken && this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'while') {
            return this.parseWhile();
        }
        
        // PRINT
        if (this.currentToken && this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'System') {
            return this.parsePrint();
        }
        
        if (this.currentToken) {
            this.errors.push(new Error(
                'SINTÁCTICO',
                this.currentToken.value,
                'Sentencia no válida',
                this.currentToken.line,
                this.currentToken.column
            ));
            this.advance(); // Avanzar para evitar bucle infinito
        }
        return false;
    }

    parseDeclaracion() {
        // DECLARACION ::= TIPO LISTA_VARS ';'
        if (!this.parseTipo()) return false;
        if (!this.parseListaVars()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ';')) return false;
        return true;
    }

    parseListaVars() {
        // LISTA_VARS ::= VAR_DECL (',' VAR_DECL)*
        if (!this.parseVarDecl()) return false;
        
        while (this.currentToken && this.currentToken.value === ',') {
            this.advance(); // ,
            if (!this.parseVarDecl()) return false;
        }
        
        return true;
    }

    parseVarDecl() {
        // VAR_DECL ::= ID ('=' EXPRESION)?
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        
        if (this.currentToken && this.currentToken.value === '=') {
            this.advance(); // =
            if (!this.parseExpresion()) return false;
        }
        
        return true;
    }

    parseAsignacion() {
        // ASIGNACION ::= ID '=' EXPRESION ';'
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        if (!this.expect(TOKEN_TYPES.OPERATOR, '=')) return false;
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ';')) return false;
        return true;
    }

    parseIf() {
        // IF ::= 'if' '(' EXPRESION ')' '{' SENTENCIAS '}' ('else' '{' SENTENCIAS '}')?
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'if')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '(')) return false;
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
        if (!this.parseSentencias()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        
        if (this.currentToken && this.currentToken.value === 'else') {
            this.advance(); // else
            if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
            if (!this.parseSentencias()) return false;
            if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        }
        
        return true;
    }

    parseFor() {
        // FOR ::= 'for' '(' FOR_INIT ';' EXPRESION ';' FOR_UPDATE ')' '{' SENTENCIAS '}'
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'for')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '(')) return false;
        
        // FOR_INIT ::= TIPO ID '=' EXPRESION
        if (!this.parseTipo()) return false;
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        if (!this.expect(TOKEN_TYPES.OPERATOR, '=')) return false;
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ';')) return false;
        
        // EXPRESION (condición)
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ';')) return false;
        
        // FOR_UPDATE ::= ID ('++' | '--')
        if (!this.expect(TOKEN_TYPES.IDENTIFIER)) return false;
        if (!(this.match(TOKEN_TYPES.OPERATOR, '++') || this.match(TOKEN_TYPES.OPERATOR, '--'))) {
            this.errors.push(new Error(
                'SINTÁCTICO',
                this.currentToken ? this.currentToken.value : 'EOF',
                "Se esperaba '++' o '--'",
                this.currentToken ? this.currentToken.line : 1,
                this.currentToken ? this.currentToken.column : 1
            ));
            return false;
        }
        
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
        if (!this.parseSentencias()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        
        return true;
    }

    parseWhile() {
        // WHILE ::= 'while' '(' EXPRESION ')' '{' SENTENCIAS '}'
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'while')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '(')) return false;
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '{')) return false;
        if (!this.parseSentencias()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '}')) return false;
        return true;
    }

    parsePrint() {
        // PRINT ::= 'System' '.' 'out' '.' 'println' '(' EXPRESION ')' ';'
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'System')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '.')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'out')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '.')) return false;
        if (!this.expect(TOKEN_TYPES.KEYWORD, 'println')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, '(')) return false;
        if (!this.parseExpresion()) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
        if (!this.expect(TOKEN_TYPES.SEPARATOR, ';')) return false;
        return true;
    }

    parseExpresion() {
        // EXPRESION ::= TERMINO (OP_COMPARACION TERMINO)*
        if (!this.parseTermino()) return false;
        
        while (this.currentToken && this.isComparisonOperator()) {
            this.advance(); // Operador
            if (!this.parseTermino()) return false;
        }
        
        return true;
    }

    parseTermino() {
        // TERMINO ::= FACTOR (('+' | '-') FACTOR)*
        if (!this.parseFactor()) return false;
        
        while (this.currentToken && (this.currentToken.value === '+' || this.currentToken.value === '-')) {
            this.advance(); // Operador
            if (!this.parseFactor()) return false;
        }
        
        return true;
    }

    parseFactor() {
        // FACTOR ::= PRIMARIO (('*' | '/') PRIMARIO)*
        if (!this.parsePrimario()) return false;
        
        while (this.currentToken && (this.currentToken.value === '*' || this.currentToken.value === '/')) {
            this.advance(); // Operador
            if (!this.parsePrimario()) return false;
        }
        
        return true;
    }

    parsePrimario() {
        // PRIMARIO ::= ID | LITERAL | '(' EXPRESION ')'
        
        if (!this.currentToken) {
            this.errors.push(new Error(
                'SINTÁCTICO',
                'EOF',
                'Se esperaba una expresión',
                1,
                1
            ));
            return false;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
            this.advance();
            return true;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.INTEGER || 
            this.currentToken.type === TOKEN_TYPES.DECIMAL ||
            this.currentToken.type === TOKEN_TYPES.STRING ||
            this.currentToken.type === TOKEN_TYPES.CHARACTER ||
            this.currentToken.type === TOKEN_TYPES.BOOLEAN) {
            this.advance();
            return true;
        }
        
        if (this.currentToken.value === '(') {
            this.advance(); // (
            if (!this.parseExpresion()) return false;
            if (!this.expect(TOKEN_TYPES.SEPARATOR, ')')) return false;
            return true;
        }
        
        this.errors.push(new Error(
            'SINTÁCTICO',
            this.currentToken.value,
            'Expresión primaria no válida',
            this.currentToken.line,
            this.currentToken.column
        ));
        return false;
    }

    parseTipo() {
        // TIPO ::= 'int' | 'double' | 'char' | 'boolean' | 'String'
        if (this.currentToken && (this.currentToken.value === 'int' || 
            this.currentToken.value === 'double' || 
            this.currentToken.value === 'char' || 
            this.currentToken.value === 'boolean' || 
            this.currentToken.value === 'String')) {
            this.advance();
            return true;
        }
        
        if (this.currentToken) {
            this.errors.push(new Error(
                'SINTÁCTICO',
                this.currentToken.value,
                'Tipo de dato no válido',
                this.currentToken.line,
                this.currentToken.column
            ));
        }
        return false;
    }

    isType() {
        return this.currentToken && 
               this.currentToken.type === TOKEN_TYPES.KEYWORD && 
               ['int', 'double', 'char', 'boolean', 'String'].includes(this.currentToken.value);
    }

    isComparisonOperator() {
        return this.currentToken && 
               this.currentToken.type === TOKEN_TYPES.OPERATOR &&
               ['==', '!=', '>', '<', '>=', '<='].includes(this.currentToken.value);
    }

    peek() {
        return this.currentIndex + 1 < this.tokens.length ? 
            this.tokens[this.currentIndex + 1] : null;
    }
}