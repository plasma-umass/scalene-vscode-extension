// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const child_process = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

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
	const args = ['-m', 'scalene', '--no-browser', '--outfile', outputFilename, '---', currentFilePath];  // replace with your arguments
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
			vscode.window.showErrorMessage(`Scalene: Process exited with code: ${code}`);
		} else {
			vscode.window.showInformationMessage(`Scalene: profiling complete`);
			const panel = vscode.window.createWebviewPanel(
				'scaleneView', 
				outputFilename,
				vscode.ViewColumn.One,
				{ 	enableScripts: true,
					retainContextWhenHidden: true,
					allowSameOriginForContent: true,
					//localResourceRoots: [vscode.Uri.file(path.join(__dirname, 'media'))]
				 }
			);
	
			//let htmlPath = path.join(context.extensionPath, outputFilename);
			let content = fs.readFileSync(outputFilename, 'utf-8');
			panel.webview.html = content;
		}
	});
	
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	const currentEditor = vscode.window.activeTextEditor;
    let currentFilePath = "";

	if (currentEditor) {
    	currentFilePath = currentEditor.document.uri.fsPath;
    	console.log(currentFilePath);
	} else {
		console.log("Not editing a file.");
	}

	// Check whether the file ends in ".py"
	let isPython = currentFilePath.endsWith(".py");

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Scalene is now active.');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('scalene.helloWorld', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		if (isPython) {
//			vscode.window.showInformationMessage('Scalene: Now profiling ' + currentFilePath);
			runScalene(currentFilePath);	
		} else {
			vscode.window.showInformationMessage('Scalene: Not a Python file.');
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
