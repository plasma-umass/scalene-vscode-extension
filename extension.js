// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const child_process = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

function getBestPythonPath() {
  // Check if Python extension is installed and active
  const pythonExtension = vscode.extensions.getExtension("ms-python.python");

  if (pythonExtension && pythonExtension.isActive) {
    const pythonConfig = vscode.workspace.getConfiguration("python");
    const pythonPathFromExtension = pythonConfig.get("pythonPath");

    if (pythonPathFromExtension) {
      return pythonPathFromExtension;
    }

    if (pythonExtension.exports.settings.getExecutionDetails) {
      const pythonPathFromActiveDocument = pythonExtension.exports.settings.getExecutionDetails(vscode.window.activeTextEditor.document.uri).execCommand[0];
      return pythonPathFromActiveDocument;
    }
  }

  // Fallback to using the environment
  try {
    const platform = process.platform;

    if (platform === "win32") {
      // On Windows, use 'where'
      const pythonPath = child_process
        .execSync("where python")
        .toString()
        .split("\r\n")[0];
      if (pythonPath.includes("Python3") || pythonPath.includes("python3")) {
        return pythonPath;
      }
    } else {
      // On Linux/Mac, use 'which'
      const pythonPath = child_process
        .execSync("which python3")
        .toString()
        .trim();
      return pythonPath;
    }
  } catch (error) {
    console.error("Error finding Python path:", error);
  }

  // If everything fails, return a default (this might not always be accurate)
  return "python3";
}

/**
 *
 * @param {string} currentFilePath
 */

function runScalene(currentFilePath, context) {
  const dismissButton = { title: "Dismiss" };
  vscode.window.showInformationMessage(
    "Scalene: now profiling " + currentFilePath,
    dismissButton,
  );

  // Create a unique temp directory for our extension
  const tempDir = path.join(os.tmpdir(), "scalene_" + Date.now());
  fs.mkdirSync(tempDir);

  const outputFilename = `${tempDir}/profile-${process.pid}.html`;
  const executablePath = getBestPythonPath();
  const args = [
    "-m",
    "scalene",
    "--no-browser",
    "--outfile",
    outputFilename,
    "---",
    currentFilePath,
  ];
  const proc = child_process.spawn(executablePath, args);

  // Redirect stdout to the Output pane ("channel")
  const outputChannel = vscode.window.createOutputChannel("Output");
  // Show the output pane to the user
  outputChannel.show();

  proc.stdout.on("data", (data) => {
    outputChannel.appendLine(`${data}`);
  });

  if (false) {
    // disabled for now
    proc.stdout.on("data", (data) => {
      vscode.window.showInformationMessage(`STDOUT: ${data}`);
    });

    proc.stderr.on("data", (data) => {
      vscode.window.showWarningMessage(`STDERR: ${data}`);
    });
  }

  let panel;

  proc.on("close", (code) => {
    if (code !== 0) {
      vscode.window.showErrorMessage(
        `Scalene: process exited with code: ${code}`,
      );
      return;
    }
    panel = vscode.window.createWebviewPanel(
      "scaleneView",
      // outputFilename,
      `Scalene: ${currentFilePath}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        enableCommandUris: true,
        allowSameOriginForContent: true,
        //localResourceRoots: [vscode.Uri.file(path.join(__dirname, 'media'))]
        //retainContextWhenHidden: true, // This will ensure WebView is not reset when hidden.
      },
    );
    context.subscriptions.push(
      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "jumpToLine":
              const filePath = message.filePath;
              const lineNumber = message.lineNumber - 1;

              const documentUri = vscode.Uri.file(filePath);
              const document =
                await vscode.workspace.openTextDocument(documentUri);
              const editor = await vscode.window.showTextDocument(document);

              const line = Math.min(lineNumber, document.lineCount - 1);
              const position = new vscode.Position(line, 0);
              editor.selection = new vscode.Selection(position, position);
              editor.revealRange(new vscode.Range(position, position));

              break;
          }
        },
        undefined,
        context.subscriptions,
      ),
    );
    // outputChannel.appendLine(outputFilename);
    let content = fs.readFileSync(outputFilename, "utf-8");
    panel.webview.html = content;
  });
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "scalene.profile",
    function () {
      const currentEditor = vscode.window.activeTextEditor;
      let currentFilePath = "";

      if (currentEditor) {
        currentFilePath = currentEditor.document.uri.fsPath;
      } else {
        return;
      }

      // Check whether the file ends in ".py"
      let isPython = currentFilePath.endsWith(".py");

      if (isPython) {
        runScalene(currentFilePath, context);
      } else {
        vscode.window.showInformationMessage(
          `Scalene: ${currentFilePath} is not a Python file.`,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
