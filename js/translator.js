class Translator {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;
        this.pythonCode = '';
        this.indentLevel = 0;
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

    getIndent() {
        return '    '.repeat(this.indentLevel);
    }

    translate() {
        this.pythonCode = '';
        this.currentIndex = 0;
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;
        this.indentLevel = 0;

        this.translateProgram();
        return this.pythonCode;
    }

    translateProgram() {
        // 'public' 'class' ID '{' MAIN '}'
        this.advance(); // public
        this.advance(); // class
        const className = this.currentToken.value;
        this.advance(); // ID
        this.advance(); // {
        
        this.pythonCode += `# Traducción de ${className} a Python\n\n`;
        this.pythonCode += "def main():\n";
        this.indentLevel++;
        
        this.translateMain();
        
        this.indentLevel--;
        this.pythonCode += "\nif __name__ == \"__main__\":\n";
        this.pythonCode += "    main()\n";
        
        this.advance(); // }
    }

    translateMain() {
        // 'public' 'static' 'void' 'main' '(' 'String' '[' ']' ID ')' '{' SENTENCIAS '}'
        this.advance(); // public
        this.advance(); // static
        this.advance(); // void
        this.advance(); // main
        this.advance(); // (
        this.advance(); // String
        this.advance(); // [
        this.advance(); // ]
        this.advance(); // args
        this.advance(); // )
        this.advance(); // {
        
        this.translateSentencias();
        
        this.advance(); // }
    }

    translateSentencias() {
        while (this.currentToken && 
               !(this.currentToken.type === TOKEN_TYPES.SEPARATOR && 
                 this.currentToken.value === '}')) {
            
            // Manejar comentarios
            if (this.currentToken.type === TOKEN_TYPES.COMMENT) {
                this.translateComment();
                continue;
            }
            
            // Saltar punto y coma vacíos
            if (this.currentToken.type === TOKEN_TYPES.SEPARATOR && this.currentToken.value === ';') {
                this.advance();
                continue;
            }
            
            this.translateSentencia();
        }
    }

    translateComment() {
        const indent = this.getIndent();
        const comment = this.currentToken.value;
        
        // Convertir comentarios de Java a Python
        if (comment.startsWith('//')) {
            // Comentario de línea
            this.pythonCode += indent + '#' + comment.substring(2) + '\n';
        } else if (comment.startsWith('/*') && comment.endsWith('*/')) {
            // Comentario de bloque
            const blockComment = comment.substring(2, comment.length - 2);
            // Para comentarios de bloque multilínea, usar triple comillas simples
            if (blockComment.includes('\n')) {
                this.pythonCode += indent + "'''" + blockComment + "'''\n";
            } else {
                this.pythonCode += indent + '#' + blockComment + '\n';
            }
        }
        
        this.advance();
    }

    translateSentencia() {
        const indent = this.getIndent();
        
        // DECLARACION
        if (this.isType()) {
            this.translateDeclaracion();
            return;
        }
        
        // ASIGNACION
        if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER && 
            this.peek() && this.peek().value === '=') {
            this.translateAsignacion();
            return;
        }
        
        // IF
        if (this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'if') {
            this.translateIf();
            return;
        }
        
        // FOR
        if (this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'for') {
            this.translateFor();
            return;
        }
        
        // WHILE
        if (this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'while') {
            this.translateWhile();
            return;
        }
        
        // PRINT
        if (this.currentToken.type === TOKEN_TYPES.KEYWORD && this.currentToken.value === 'System') {
            this.translatePrint();
            return;
        }
        
        this.advance(); // En caso de error, avanzar
    }

    translateDeclaracion() {
        const indent = this.getIndent();
        this.translateTipo();
        this.translateListaVars();
        this.pythonCode += '\n';
        this.advance(); // ;
    }

    translateListaVars() {
        this.translateVarDecl();
        
        while (this.currentToken && this.currentToken.value === ',') {
            this.pythonCode += ', ';
            this.advance(); // ,
            this.translateVarDecl();
        }
    }

    translateVarDecl() {
        const varName = this.currentToken.value;
        this.pythonCode += varName;
        this.advance(); // ID
        
        if (this.currentToken && this.currentToken.value === '=') {
            this.pythonCode += ' = ';
            this.advance(); // =
            this.translateExpresion();
        }
    }

    translateAsignacion() {
        const indent = this.getIndent();
        this.pythonCode += indent;
        
        const varName = this.currentToken.value;
        this.pythonCode += varName;
        this.advance(); // ID
        
        this.pythonCode += ' = ';
        this.advance(); // =
        
        this.translateExpresion();
        this.pythonCode += '\n';
        this.advance(); // ;
    }

    translateIf() {
        const indent = this.getIndent();
        this.pythonCode += indent;
        
        this.advance(); // if
        this.pythonCode += 'if ';
        
        this.advance(); // (
        this.translateExpresion();
        this.advance(); // )
        
        this.pythonCode += ':\n';
        this.indentLevel++;
        
        this.advance(); // {
        this.translateSentencias();
        this.advance(); // }
        
        this.indentLevel--;
        
        if (this.currentToken && this.currentToken.value === 'else') {
            this.pythonCode += indent + 'else:\n';
            this.indentLevel++;
            this.advance(); // else
            this.advance(); // {
            this.translateSentencias();
            this.advance(); // }
            this.indentLevel--;
        }
    }

    translateFor() {
        const indent = this.getIndent();
        this.pythonCode += indent;
        
        this.advance(); // for
        this.advance(); // (
        
        // Inicialización
        if (this.isType()) {
            this.translateDeclaracion();
            // En Python, las declaraciones en for no son válidas, así que las movemos arriba
            // Aquí solo manejamos la asignación
        } else if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER && 
                   this.peek() && this.peek().value === '=') {
            const initVar = this.currentToken.value;
            this.advance(); // ID
            this.advance(); // =
            const initExpr = this.translateExpresionToString();
            this.pythonCode += indent + initVar + ' = ' + initExpr + '\n';
        }
        
        // Condición
        let condition = 'True';
        if (this.currentToken.value !== ';') {
            condition = this.translateExpresionToString();
        }
        this.advance(); // ;
        
        // Incremento
        let increment = '';
        if (this.currentToken.value !== ')') {
            increment = this.translateExpresionToString();
        }
        this.advance(); // )
        
        this.pythonCode += indent + 'while ' + condition + ':\n';
        this.indentLevel++;
        
        this.advance(); // {
        this.translateSentencias();
        
        // Agregar incremento al final del bloque
        if (increment) {
            this.pythonCode += this.getIndent() + increment + '\n';
        }
        
        this.advance(); // }
        this.indentLevel--;
    }

    translateWhile() {
        const indent = this.getIndent();
        this.pythonCode += indent;
        
        this.advance(); // while
        this.pythonCode += 'while ';
        
        this.advance(); // (
        this.translateExpresion();
        this.advance(); // )
        
        this.pythonCode += ':\n';
        this.indentLevel++;
        
        this.advance(); // {
        this.translateSentencias();
        this.advance(); // }
        
        this.indentLevel--;
    }

    translatePrint() {
        const indent = this.getIndent();
        this.pythonCode += indent;
        
        this.advance(); // System
        this.advance(); // .
        this.advance(); // out
        this.advance(); // .
        this.advance(); // println
        this.advance(); // (
        
        this.pythonCode += 'print(';
        this.translateExpresion();
        this.pythonCode += ')';
        
        this.advance(); // )
        this.pythonCode += '\n';
        this.advance(); // ;
    }

    translateExpresion() {
        this.translateTermino();
        
        while (this.currentToken && this.isOperator()) {
            const op = this.currentToken.value;
            let pyOp = op;
            
            // Convertir operadores de Java a Python
            if (op === '==') pyOp = '==';
            else if (op === '!=') pyOp = '!=';
            else if (op === '&&') pyOp = 'and';
            else if (op === '||') pyOp = 'or';
            else if (op === '++') { 
                // Manejar incremento como expresión separada
                this.advance();
                return;
            }
            else if (op === '--') {
                // Manejar decremento como expresión separada
                this.advance();
                return;
            }
            
            this.pythonCode += ' ' + pyOp + ' ';
            this.advance(); // Operador
            this.translateTermino();
        }
    }

    translateExpresionToString() {
        const startIndex = this.currentIndex;
        const startToken = this.currentToken;
        
        // Crear un traductor temporal para obtener la expresión como string
        const tempTranslator = new Translator(this.tokens.slice(startIndex));
        let expression = '';
        
        const originalAdvance = tempTranslator.advance;
        tempTranslator.advance = function() {
            if (this.currentToken) {
                expression += this.currentToken.value + ' ';
            }
            originalAdvance.call(this);
        };
        
        tempTranslator.translateExpresion();
        
        // Avanzar el traductor principal
        while (this.currentIndex < startIndex + tempTranslator.currentIndex) {
            this.advance();
        }
        
        return expression.trim();
    }

    translateTermino() {
        if (this.currentToken.type === TOKEN_TYPES.INTEGER || 
            this.currentToken.type === TOKEN_TYPES.DECIMAL) {
            this.pythonCode += this.currentToken.value;
            this.advance();
            return;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.STRING) {
            this.pythonCode += '"' + this.currentToken.value + '"';
            this.advance();
            return;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.CHARACTER) {
            this.pythonCode += "'" + this.currentToken.value + "'";
            this.advance();
            return;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.BOOLEAN) {
            this.pythonCode += this.currentToken.value === 'true' ? 'True' : 'False';
            this.advance();
            return;
        }
        
        if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
            this.pythonCode += this.currentToken.value;
            this.advance();
            return;
        }
        
        if (this.currentToken.value === '(') {
            this.pythonCode += '(';
            this.advance(); // (
            this.translateExpresion();
            this.pythonCode += ')';
            this.advance(); // )
            return;
        }
        
        this.advance(); // En caso de error
    }

    translateTipo() {
        // En Python no necesitamos declarar tipos, así que ignoramos esta parte
        this.advance(); // tipo
    }

    isType() {
        return this.currentToken && 
               this.currentToken.type === TOKEN_TYPES.KEYWORD && 
               ['int', 'double', 'char', 'boolean', 'String'].includes(this.currentToken.value);
    }

    isOperator() {
        return this.currentToken && 
               this.currentToken.type === TOKEN_TYPES.OPERATOR;
    }

    peek() {
        return this.currentIndex + 1 < this.tokens.length ? 
            this.tokens[this.currentIndex + 1] : null;
    }
}