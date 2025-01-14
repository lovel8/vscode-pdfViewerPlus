import * as vscode from 'vscode';
import { PdfCustomProvider } from './pdfProvider';

export function activate(context: vscode.ExtensionContext): void {
  const extensionRoot = vscode.Uri.file(context.extensionPath);
  // Register our custom editor provider
  const provider = new PdfCustomProvider(extensionRoot);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      PdfCustomProvider.viewType,
      provider,
      {
        webviewOptions: {
          enableFindWidget: false, // default
          retainContextWhenHidden: true,
        },
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'pdfViewer.translate',
      async (uri: vscode.Uri) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.uri === uri) {
          const webviewPanel = vscode.window.createWebviewPanel(
            'pdfViewer',
            'PDF Viewer',
            vscode.ViewColumn.One,
            {}
          );
          await provider.translateAndLoadPdf(uri, webviewPanel);
        }
      }
    )
  );
}

export function deactivate(): void {}
