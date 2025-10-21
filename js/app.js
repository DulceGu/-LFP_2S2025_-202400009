class JavaBridgeApp {
    constructor() {
        this.javaCodeElement = document.getElementById('java-code');
        this.pythonCodeElement = document.getElementById('python-code');
        this.tokensTable = document.querySelector('#tokens-table tbody');
        this.lexicalErrorsTable = document.querySelector('#lexical-errors-table tbody');
        this.syntaxErrorsTable = document.querySelector('#syntax-errors-table tbody');
        this.simulationOutput = document.getElementById('simulation-output');
        this.tokenCount = document.getElementById('token-count');
        
        this.currentTokens = [];
        this.currentLexicalErrors = [];
        this.currentSyntaxErrors = [];
        this.currentPythonCode = '';
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Botones del menú
        document.getElementById('btn-new').addEventListener('click', () => this.newFile());
        document.getElementById('btn-open').addEventListener('click', () => this.openFile());
        document.getElementById('btn-save').addEventListener('click', () => this.saveFile());
        document.getElementById('btn-save-python').addEventListener('click', () => this.savePythonFile());
        document.getElementById('btn-exit').addEventListener('click', () => this.exitApp());
        
        document.getElementById('btn-translate').addEventListener('click', () => this.translateCode());
        document.getElementById('btn-tokens').addEventListener('click', () => this.showTokens());
        document.getElementById('btn-simulate').addEventListener('click', () => this.simulateExecution());
        
        document.getElementById('btn-about').addEventListener('click', () => this.showAbout());
        document.getElementById('btn-download-html').addEventListener('click', () => this.downloadHTML());

        // Tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Modal
        const modal = document.getElementById('about-modal');
        const closeBtn = document.querySelector('.close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    switchTab(tabName) {
        // Remover clase active de todos los botones y paneles
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Activar el tab seleccionado
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    newFile() {
        if (confirm('¿Estás seguro de que quieres crear un nuevo archivo? Se perderán los cambios no guardados.')) {
            this.javaCodeElement.value = '';
            this.pythonCodeElement.value = '';
            this.clearResults();
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.java,.txt';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                    this.javaCodeElement.value = event.target.result;
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    saveFile() {
        const content = this.javaCodeElement.value;
        const filename = 'codigo_java.java';
        downloadFile(content, filename);
    }

    savePythonFile() {
        const content = this.pythonCodeElement.value;
        if (!content) {
            alert('No hay código Python para guardar. Primero genera la traducción.');
            return;
        }
        
        const filename = 'codigo_python.py';
        downloadFile(content, filename);
    }

    exitApp() {
        if (confirm('¿Estás seguro de que quieres salir?')) {
            window.close();
        }
    }

    translateCode() {
        const javaCode = this.javaCodeElement.value;
        
        if (!javaCode.trim()) {
            alert('Por favor, ingresa código Java para analizar.');
            return;
        }
        
        // Análisis léxico
        const lexer = new Lexer(javaCode);
        const lexicalResult = lexer.tokenize();
        
        this.currentTokens = lexicalResult.tokens;
        this.currentLexicalErrors = lexicalResult.errors;
        
        // Análisis sintáctico
        let syntaxResult = { success: true, errors: [] };
        if (lexicalResult.errors.length === 0) {
            const parser = new Parser(this.currentTokens);
            syntaxResult = parser.parse();
            this.currentSyntaxErrors = syntaxResult.errors;
        } else {
            this.currentSyntaxErrors = [];
        }
        
        // Traducción a Python
        if (lexicalResult.errors.length === 0 && syntaxResult.success) {
            const translator = new Translator(this.currentTokens);
            this.currentPythonCode = translator.translate();
            this.pythonCodeElement.value = this.currentPythonCode;
        } else {
            this.currentPythonCode = '';
            this.pythonCodeElement.value = '# No se pudo traducir debido a errores en el código Java';
        }
        
        // Mostrar resultados
        this.displayResults();
        
        // Cambiar a la pestaña de tokens por defecto
        this.switchTab('tokens');
    }

    showTokens() {
        this.translateCode();
        this.switchTab('tokens');
    }

    simulateExecution() {
        this.translateCode();
        
        if (this.currentPythonCode && !this.currentPythonCode.includes('No se pudo traducir')) {
            this.switchTab('simulation');
            this.simulatePythonCode();
        } else {
            alert('No hay código Python válido para simular.');
        }
    }

    simulatePythonCode() {
        // Esta es una simulación básica que muestra el código Python
        // En una implementación real, podrías usar un intérprete de Python en el navegador
        // como Skulpt o Pyodide para una simulación más realista
        
        const output = `Simulación de ejecución Python:\n\n${this.currentPythonCode}\n\n---\nNota: Esta es una simulación visual. Para ejecutar el código, guárdalo y ejecútalo en un entorno Python.`;
        this.simulationOutput.textContent = output;
    }

    showAbout() {
        document.getElementById('about-modal').style.display = 'block';
    }

    downloadHTML() {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Reporte JavaBridge</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .code-section { margin: 20px 0; }
        .java-code, .python-code { background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
        .errors { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <h1>Reporte JavaBridge - Traducción Java a Python</h1>
    
    <div class="code-section">
        <h2>Código Java Original</h2>
        <div class="java-code">${this.javaCodeElement.value}</div>
    </div>
    
    <div class="code-section">
        <h2>Código Python Traducido</h2>
        <div class="python-code">${this.pythonCodeElement.value || 'No disponible'}</div>
    </div>
    
    <h2>Tokens Generados: ${this.currentTokens.length}</h2>
    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Lexema</th>
                <th>Tipo</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
            ${this.currentTokens.map((token, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${token.value}</td>
                    <td>${token.type}</td>
                    <td>${token.line}</td>
                    <td>${token.column}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    ${this.currentLexicalErrors.length > 0 ? `
    <h2 class="errors">Errores Léxicos: ${this.currentLexicalErrors.length}</h2>
    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Error</th>
                <th>Descripción</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
            ${this.currentLexicalErrors.map((error, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${error.value}</td>
                    <td>${error.message}</td>
                    <td>${error.line}</td>
                    <td>${error.column}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : '<h2 class="success">No se encontraron errores léxicos</h2>'}
    
    ${this.currentSyntaxErrors.length > 0 ? `
    <h2 class="errors">Errores Sintácticos: ${this.currentSyntaxErrors.length}</h2>
    <table>
        <thead>
            <tr>
                <th>No.</th>
                <th>Error</th>
                <th>Descripción</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
            ${this.currentSyntaxErrors.map((error, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${error.value}</td>
                    <td>${error.message}</td>
                    <td>${error.line}</td>
                    <td>${error.column}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    ` : '<h2 class="success">No se encontraron errores sintácticos</h2>'}
    
    <p>Generado el: ${new Date().toLocaleString()}</p>
</body>
</html>`;
        
        downloadFile(htmlContent, 'reporte_javabridge.html', 'text/html');
    }

    displayResults() {
        // Limpiar tablas
        clearTables();
        
        // Mostrar tokens
        displayTokens(this.currentTokens);
        
        // Mostrar errores léxicos
        displayLexicalErrors(this.currentLexicalErrors);
        
        // Mostrar errores sintácticos
        displaySyntaxErrors(this.currentSyntaxErrors);
    }

    clearResults() {
        this.currentTokens = [];
        this.currentLexicalErrors = [];
        this.currentSyntaxErrors = [];
        this.currentPythonCode = '';
        
        clearTables();
        this.pythonCodeElement.value = '';
        this.tokenCount.textContent = 'Tokens generados: 0';
        this.simulationOutput.textContent = '';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new JavaBridgeApp();
});