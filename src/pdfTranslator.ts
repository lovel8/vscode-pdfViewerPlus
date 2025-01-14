import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class PdfTranslator {
  private _translationUri: vscode.Uri | undefined;

  public async translatePdf(
    sourceUri: vscode.Uri,
    destUri: vscode.Uri
  ): Promise<void> {
    const sourceFileName = path.basename(sourceUri.fsPath, '.pdf');
    const destFileName = `${sourceFileName}-mono.pdf`;
    this._translationUri = vscode.Uri.file(
      path.join(destUri.fsPath, destFileName)
    );
    if (fs.existsSync(this._translationUri.fsPath)) {
      return Promise.resolve();
    }

    const pdf2zhPath = path.resolve(__dirname, '../../resource/pdf2zh');
    return new Promise((resolve, reject) => {
      exec(
        `${pdf2zhPath} ${sourceUri.fsPath} -lo zh -o ${destUri.fsPath}`,
        (error, stdout, stderr) => {
          if (error) {
            this.dispose();
            reject(`Translation failed: ${stderr}`);
          } else {
            resolve();
          }
        }
      );
    });
  }

  public dispose(): void {
    if (this._translationUri && fs.existsSync(this._translationUri.fsPath)) {
      fs.unlink(this._translationUri.fsPath, (error) => {
        if (error) {
          console.error(
            `Failed to delete file: ${this._translationUri.fsPath}`
          );
        }
      });
    }
  }

  public get translationUri(): vscode.Uri | undefined {
    return this._translationUri;
  }
}
