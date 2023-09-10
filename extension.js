// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const child_process = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

function getPythonPath() {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (pythonExtension) {
        // Ensure the extension is activated
        const api = pythonExtension.isActive ? pythonExtension.exports : null;
        if (api) {
            // Get the selected interpreter
            const pythonPath = api.settings.getExecutionDetails().execPath;
            return pythonPath;
        }
    }
    return null;
}

//const pythonInterpreterPath = getPythonPath();
//console.log(pythonInterpreterPath);


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * 
 * @param {string} currentFilePath 
 */

function runScalene(currentFilePath) {
	vscode.window.showInformationMessage('Scalene: now profiling ' + currentFilePath);

	// Create a unique temp directory for our extension
	const tempDir = path.join(os.tmpdir(), 'scalene_' + Date.now());
	fs.mkdirSync(tempDir);

	const outputFilename = `${tempDir}/profile-${process.pid}.html`;
	
	const executablePath = 'python3.11';
	const args = ['-m', 'scalene', '--cpu', '--no-browser', '--outfile', outputFilename, '---', currentFilePath];  // replace with your arguments
	const proc = child_process.spawn(executablePath, args);
	
	if (false) { // disabled for now
		proc.stdout.on('data', (data) => {
			vscode.window.showInformationMessage(`STDOUT: ${data}`);
		});
		
		proc.stderr.on('data', (data) => {
			vscode.window.showWarningMessage(`STDERR: ${data}`);
		});
	}

	proc.on('close', (code) => {
		if (code !== 0) {
			vscode.window.showErrorMessage(`Scalene: process exited with code: ${code}`);
		} else {
			vscode.window.showInformationMessage(`Scalene: profiling complete for ${currentFilePath}`);
			const panel = vscode.window.createWebviewPanel(
				'scaleneView', 
				// outputFilename,
				`Scalene: ${currentFilePath}`,
				vscode.ViewColumn.One,
				{ 	enableScripts: true,
					enableCommandUris: true,
					allowSameOriginForContent: true,
					//localResourceRoots: [vscode.Uri.file(path.join(__dirname, 'media'))]
					retainContextWhenHidden: true, // This will ensure WebView is not reset when hidden.
				 }
			);
			let content = fs.readFileSync(outputFilename, 'utf-8');
			panel.webview.html = content;
		}
	});
	
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('scalene.profile', function () {
		const currentEditor = vscode.window.activeTextEditor;
		let currentFilePath = "";
	
		if (currentEditor) {
			currentFilePath = currentEditor.document.uri.fsPath;
		} else {
			return;
		}
	
		// Check whether the file ends in ".py"
		let isPython = currentFilePath.endsWith(".py");
	
		// Display a message box to the user
		if (isPython) {
//			vscode.window.showInformationMessage('Scalene: Now profiling ' + currentFilePath);
			runScalene(currentFilePath);	
		} else {
			vscode.window.showInformationMessage('Scalene: not a Python file.');
		}

	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
