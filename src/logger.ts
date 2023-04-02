import * as vscode from "vscode";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export class Logger {
  private outputChannel = vscode.window.createOutputChannel("BladeFormatter");

  private logLevel: LogLevel = "INFO";

  public setLogLevel(logLevel: LogLevel): void {
    this.logLevel = logLevel;
  }

  public logDebug(message: string, data?: unknown): void {
    if (this.logLevel !== "DEBUG") {
      return;
    }
    this.logMessage("DEBUG", message);
    if (data) {
      this.logObject(data);
    }
  }

  public logInfo(message: string, data?: unknown): void {
    if (this.logLevel === "ERROR" || this.logLevel === "WARN") {
      return;
    }
    this.logMessage("INFO", message);
    if (data) {
      this.logObject(data);
    }
  }

  public logWarning(message: string, data?: unknown): void {
    if (this.logLevel === "ERROR") {
      return;
    }
    this.logMessage("WARN", message);
    if (data) {
      this.logObject(data);
    }
  }

  public logError(message: string, error?: unknown): void {
    this.logMessage("ERROR", message);
    if (typeof error === "string") {
      this.outputChannel.appendLine(error);
    } else if (error instanceof Error) {
      if (error.message) {
        this.logMessage("ERROR", error.message);
      }
      if (error.stack) {
        this.outputChannel.appendLine(error.stack);
      }
    } else if (error) {
      this.logObject(error);
    }
  }

  public show(): void {
    this.outputChannel.show();
  }

  private logObject(data: unknown): void {
    const message = JSON.stringify(data, null, 2);
    this.outputChannel.appendLine(message);
  }

  private logMessage(level: LogLevel, message: string): void {
    const title = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`["${level}" - ${title}] ${message}`);
  }
}
