import * as vscode from 'vscode';
import { PdfPreview } from './pdfPreview';
import { PdfTranslator } from './pdfTranslator';

export class PdfCustomProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = 'pdf.preview';

  private _activePreviewUri: vscode.Uri;
  private _activePreview: PdfPreview | undefined;
  private _pdfTranslator: PdfTranslator = new PdfTranslator();

  constructor(private readonly extensionRoot: vscode.Uri) {
    process.on('exit', () => {
      this._pdfTranslator.dispose();
    });
    process.on('SIGINT', () => {
      process.exit();
    });
    process.on('SIGTERM', () => {
      process.exit();
    });
  }

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: (): void => {} };
  }

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewEditor: vscode.WebviewPanel
  ): Promise<void> {
    this.createPreview(document.uri, webviewEditor);

    webviewEditor.onDidDispose(() => {
      this._pdfTranslator.dispose();
      this._activePreview.dispose();
    });

    webviewEditor.onDidChangeViewState(() => {
      if (webviewEditor.active) {
        this.createPreview(this._activePreviewUri, webviewEditor);
      } else if (!webviewEditor.active) {
        this.setActivePreview(undefined);
      }
    });

    const setWebviewContent = (): void => {
      webviewEditor.webview.html += `
      <script>
        const vscode = acquireVsCodeApi();
        document.getElementById('translateButton').addEventListener('click', () => {
          vscode.postMessage({ command: 'translate' });
        });
      </script>
    `;
    };

    setWebviewContent();

    webviewEditor.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'translate') {
        await this.translateAndLoadPdf(document.uri, webviewEditor);
        setWebviewContent();
      }
    });
  }

  public async translateAndLoadPdf(
    uri: vscode.Uri,
    webviewEditor: vscode.WebviewPanel
  ): Promise<void> {
    if (this._activePreviewUri === uri) {
      try {
        await this._pdfTranslator.translatePdf(uri, this.extensionRoot);
        this.createPreview(this._pdfTranslator.translationUri, webviewEditor);
      } catch (error) {
        vscode.window.showErrorMessage(error);
      }
    } else {
      this.createPreview(uri, webviewEditor);
    }
  }

  private createPreview(
    uri: vscode.Uri,
    webviewEditor: vscode.WebviewPanel
  ): PdfPreview {
    if (this._activePreview) {
      this._activePreview.dispose();
    }

    const preview = new PdfPreview(this.extensionRoot, uri, webviewEditor);
    this._activePreviewUri = uri;
    this.setActivePreview(preview);
    return preview;
  }

  public get activePreview(): PdfPreview {
    return this._activePreview;
  }

  private setActivePreview(value: PdfPreview | undefined): void {
    this._activePreview = value;
  }
}
