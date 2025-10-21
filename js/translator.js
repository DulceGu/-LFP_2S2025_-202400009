class Translator {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;
        this.pythonCode = '';
        this.indentLevel = 0;
        this.variables = new Set(); // Para trackear variables declaradas
    }

    advance() {
        this.currentIndex++;
        this.currentToken = this.currentIndex < this.tokens.length ? 
            this.tokens[this.currentIndex] : null;
    }

    getIndent() {
        return '    '.repeat(this.indentLevel);
    }

    translate() {
        this.pythonCode = '';
        this.currentIndex = 0;
        this.currentToken = this.tokens.length > 0 ? this.tokens[0] : null;
        this.indentLevel = 0;
        this.variables = new Set();

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
                const lines = blockComment.split('\n');
                for (const line of lines) {
                    this.pythonCode += indent + '# ' + line.trim() + '\n';
                }
            } else {
                this.pythonCode += indent + '# ' + blockComment + '\n';
            }
        }
        
        this.advance();
    }

    translateSentencia() {
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
        const tipo = this.currentToken.value;
        this.advance(); // tipo
    
        let firstVar = true;
    
        // Procesar lista de variables
        while (this.currentToken && this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
            if (!firstVar) {
                this.pythonCode += '\n' + indent;
            }
        
            const varName = this.currentToken.value;
            this.variables.add(varName);
            this.pythonCode += varName + ' = ';
            this.advance(); // ID
        
            if (this.currentToken && this.currentToken.value === '=') {
                this.advance(); // =
                this.translateExpresion();
            } else {
                // Asignar valor por defecto según el tipo
                switch(tipo) {
                    case 'int':
                        this.pythonCode += '0';
                        break;
                    case 'double':
                        this.pythonCode += '0.0';
                        break;
                    case 'char':
                        this.pythonCode += "''";
                        break;
                    case 'String':
                        this.pythonCode += '""';
                        break;
                    case 'boolean':
                        this.pythonCode += 'False';
                        break;
                    default:
                        this.pythonCode += 'None';
                }
            }
        
            this.pythonCode += '  # Declaracion: ' + tipo;
        
            if (this.currentToken && this.currentToken.value === ',') {
                this.pythonCode += '\n';
                this.advance(); // ,
                firstVar = false;
            } else {
                this.pythonCode += '\n';
                break;
            }
        }
    
        this.advance(); // ;
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
    
        this.advance(); // for
        this.advance(); // (
    
        // Inicialización - manejar como declaración separada
        if (this.isType()) {
            // Declaración con tipo (int i = 1)
            const tipo = this.currentToken.value;
            this.advance(); // tipo
            const varName = this.currentToken.value;
            this.advance(); // ID
            this.advance(); // =
            const initValue = this.translateExpresionToString();
        
            this.pythonCode += indent + varName + ' = ' + initValue + '  # Declaracion: ' + tipo + '\n';
        } else if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
            // Asignación simple (i = 0)
            const varName = this.currentToken.value;
            this.advance(); // ID
            this.advance(); // =
            const initValue = this.translateExpresionToString();
        
            this.pythonCode += indent + varName + ' = ' + initValue + '\n';
        }
        this.advance(); // ;
    
        // Condición
        let condition = 'True';
        if (this.currentToken && this.currentToken.value !== ';') {
            condition = this.translateExpresionToString();
        }
        this.advance(); // ;
    
        // Incremento - CAPTURAR PERO NO ESCRIBIR AÚN
        let increment = '';
        if (this.currentToken && this.currentToken.value !== ')') {
            if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER && 
                this.peek() && (this.peek().value === '++' || this.peek().value === '--')) {
            
                const varName = this.currentToken.value;
                const op = this.peek().value;
                this.advance(); // ID
                this.advance(); // ++ or --
            
                increment = varName + (op === '++' ? ' += 1' : ' -= 1');
            } else {
                increment = this.translateExpresionToString();
            }
        }
        this.advance(); // )
    
        // Escribir el while
        this.pythonCode += indent + 'while ' + condition + ':\n';
        this.indentLevel++;
    
        this.advance(); // {
        this.translateSentencias();
    
        // Agregar incremento al final del bloque SI EXISTE
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
    
        // Capturar la expresión completa
        const startIndex = this.currentIndex;
        let expression = '';
    
        while (this.currentToken && this.currentToken.value !== ')') {
            if (this.currentToken.type === TOKEN_TYPES.STRING) {
                expression += '"' + this.currentToken.value + '"';
            } else if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
                // Para variables, agregar str() alrededor
                expression += 'str(' + this.currentToken.value + ')';
            } else if (this.currentToken.type === TOKEN_TYPES.INTEGER || 
                    this.currentToken.type === TOKEN_TYPES.DECIMAL ||
                    this.currentToken.type === TOKEN_TYPES.BOOLEAN) {
                // Para números y booleanos, también convertir a string
                const value = this.currentToken.type === TOKEN_TYPES.BOOLEAN ? 
                            (this.currentToken.value === 'true' ? 'True' : 'False') : 
                            this.currentToken.value;
                expression += 'str(' + value + ')';
            } else if (this.currentToken.value === '+') {
                expression += ' + ';
            } else {
                expression += this.currentToken.value;
            }
            this.advance();
        }
    
        // Si la expresión ya es un string literal, no necesita str()
        if (expression.startsWith('"') && expression.endsWith('"') && !expression.includes('+')) {
            this.pythonCode += expression;
        } else {
            this.pythonCode += expression;
        }
    
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
            
            this.pythonCode += ' ' + pyOp + ' ';
            this.advance(); // Operador
            this.translateTermino();
        }
    }

    translateExpresionToString() {
        const startIndex = this.currentIndex;
        const oldPythonCode = this.pythonCode;
        this.pythonCode = '';
        
        this.translateExpresion();
        const expression = this.pythonCode;
        
        // Restaurar estado
        this.pythonCode = oldPythonCode;
        this.currentIndex = startIndex;
        this.currentToken = this.tokens[this.currentIndex];
        
        return expression.trim();
    }

    translateTermino() {
        this.translateFactor();
        
        while (this.currentToken && (this.currentToken.value === '+' || this.currentToken.value === '-')) {
            const op = this.currentToken.value;
            this.pythonCode += ' ' + op + ' ';
            this.advance(); // Operador
            this.translateFactor();
        }
    }

    translateFactor() {
        this.translatePrimario();
        
        while (this.currentToken && (this.currentToken.value === '*' || this.currentToken.value === '/')) {
            const op = this.currentToken.value;
            this.pythonCode += ' ' + op + ' ';
            this.advance(); // Operador
            this.translatePrimario();
        }
    }

    translatePrimario() {
        if (!this.currentToken) return;
        
        if (this.currentToken.type === TOKEN_TYPES.IDENTIFIER) {
            this.pythonCode += this.currentToken.value;
            this.advance();
            return;
        }
        
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

    // Helper para detectar si necesita conversión a string
    needsStringConversion(expression) {
        // Si la expresión contiene + y no es puramente numérica, probablemente necesite str()
        if (expression.includes('+')) {
            // Si contiene variables o números mezclados con strings
            const tokens = expression.split('+');
            for (const token of tokens) {
                const trimmed = token.trim();
                // Si es un identificador (variable) o número puro
                if (this.variables.has(trimmed) || /^\d+$/.test(trimmed) || /^\d+\.\d+$/.test(trimmed)) {
                    return true;
                }
            }
        }
        // Si es solo una variable o número
        const trimmed = expression.trim();
        if (this.variables.has(trimmed) || /^\d+$/.test(trimmed) || /^\d+\.\d+$/.test(trimmed)) {
            return true;
        }
        return false;
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