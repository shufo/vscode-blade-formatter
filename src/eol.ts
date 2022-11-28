import vscode, { EndOfLine } from "vscode";
import os from "os";
import { RuntimeConfig } from "./runtimeConfig";

export async function getEolCharacter(
    runtimeConfig: RuntimeConfig | undefined
): Promise<EndOfLine | null> {
    // prioritize runtime config
    if (runtimeConfig?.endOfLine === 'CRLF') {
        return vscode.EndOfLine.CRLF;
    }

    if (runtimeConfig?.endOfLine === 'LF') {
        return vscode.EndOfLine.LF;
    }

    // prioritize extension setting
    const extConfig = vscode.workspace.getConfiguration(
        "bladeFormatter.format"
    );
    const extConfigEndOfLine = extConfig.endOfLine;

    if (extConfigEndOfLine === 'CRLF') {
        return vscode.EndOfLine.CRLF;
    }

    if (extConfigEndOfLine === 'LF') {
        return vscode.EndOfLine.LF;
    }

    // workspace setting
    const vscodeConfig = vscode.workspace.getConfiguration('files');
    const eol = await vscodeConfig.get('eol');

    if (eol === '\r\n') {
        return vscode.EndOfLine.CRLF;
    } else if (eol === '\n') {
        return vscode.EndOfLine.LF;
    }

    // use os specific character if setting is auto
    if (os.EOL === '\r\n') {
        return vscode.EndOfLine.CRLF;
    }

    if (os.EOL === '\n') {
        return vscode.EndOfLine.LF;
    }

    return null;
}
