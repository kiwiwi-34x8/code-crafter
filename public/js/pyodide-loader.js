// public/js/pyodide-loader.js
// This is the FIXED version that solves the "race condition" bug.
class PyodideLoader {
    constructor() {
        this.pyodide = null;
        this.isReady = false;
        this.lastOutput = ""; // This will store our output
    }

    async initialize() {
        try {
            console.log("Starting Pyodide load...");
            
            this.pyodide = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
            });
            
            console.log("Pyodide loaded, setting up output...");
            
            // This now sends output to TWO places:
            // 1. The screen (window.updateOutput)
            // 2. Our internal variable (this.lastOutput)
            this.pyodide.setStdout({ 
                batched: (text) => {
                    this.lastOutput += text; 
                    if (typeof window.updateOutput === 'function') {
                        window.updateOutput(text); 
                    }
                }
            });
            
            this.pyodide.setStderr({ 
                batched: (text) => {
                    const errorText = "Error: " + text;
                    this.lastOutput += errorText; 
                    if (typeof window.updateOutput === 'function') {
                        window.updateOutput(errorText);
                    }
                }
            });
            
            this.isReady = true;
            console.log("Pyodide ready!");
            
            if (typeof window.onPyodideReady === 'function') {
                window.onPyodideReady();
            }
            
            return { success: true };
            
        } catch (error) {
            console.error("Pyodide load failed:", error);
            return { success: false, error: error.message };
        }
    }

    async runCode(code) {
        if (!this.isReady) {
            return { success: false, error: "Python interpreter not ready" };
        }
        
        this.lastOutput = ""; // Clear the internal output before each run
        
        try {
            await this.pyodide.runPythonAsync(code);
            
            // Return the captured output
            return { success: true, output: this.lastOutput }; 
            
        } catch (error) {
            // Return the error and any partial output
            return { 
                success: false, 
                error: error.message,
                output: this.lastOutput 
            };
        }
    }
}

// Global functions for output handling
window.clearOutput = function() {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.textContent = "";
    }
};

window.updateOutput = function(text) {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.textContent += text;
        outputElement.scrollTop = outputElement.scrollHeight;
    }
};

window.onPyodideReady = function() {
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.textContent = "✅ Python interpreter ready! You can run your code now.";
    }
    
    const runButton = document.getElementById('run-button');
    if (runButton) {
        runButton.disabled = false;
        runButton.textContent = "Run Code";
    }
};

async function initializePython() {
    console.log("Initializing Python...");
    window.pyodideLoader = new PyodideLoader();
    const result = await window.pyodideLoader.initialize();
    
    if (!result.success) {
        const outputElement = document.getElementById('output');
        if (outputElement) {
            outputElement.textContent = "❌ Failed to load Python: " + result.error;
        }
    }
}