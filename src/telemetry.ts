import vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { getExtensionContext } from './extensionContext';

type ErrorEvent = 'UNCAUGHT_EXCEPTION' | 'CAUGHT_ERROR';

export const enum TelemetryEventNames {
    /**
     * Extension startup event.
     */
    Startup = 'STARTUP',
    /**
     * First ever extension activation.
     */
    NewInstall = 'NEW_INSTALL',
}

const extensionId = "shufo.vscode-blade-formatter";

/**
 * Map event names with the data type of payload sent
 * When undefined - send only the event name.
 */
interface TelemetryEventNamePropertyMapping {
    [TelemetryEventNames.Startup]: undefined;
    [TelemetryEventNames.NewInstall]: undefined;
}

class Telemetry {
    private reporter: TelemetryReporter;

    constructor(extensionVersion: string) {
        // set your APP_INSIGHT_INSTRUMENT_KEY to `.env` file
        const key = process.env.APP_INSIGHT_INSTRUMENT_KEY;
        this.reporter = new TelemetryReporter(extensionId, extensionVersion, key);
    }

    /**
     * Check if it's allowed to send the telemetry.
     */
    private canSend(): boolean {
        // Don't send telemetry when developing or testing the extension
        if (getExtensionContext().extensionMode !== vscode.ExtensionMode.Production) {
            return false;
        }
        // Don't send telemetry when user disabled it in Settings
        if (!vscode.env.isTelemetryEnabled) {
            return false;
        }
        return true;
    }

    /**
     * Send custom events.
     *
     * @param eventName sent message title
     * @param payload custom properties to add to the message
     */
    send<T extends TelemetryEventNamePropertyMapping, E extends keyof T>(eventName: E, payload?: T[E]): void {
        if (!this.canSend()) {
            return;
        }

        // @ts-ignore
        this.reporter.sendTelemetryEvent(eventName, payload);
    }

    /**
     * Send caught or uncaught errors.
     *
     * @param eventName sent message title
     * @param error error object of the uncaught exception
     */
    sendError(eventName: ErrorEvent, error?: Error): void {
        if (!this.canSend()) {
            return;
        }

        if (error) {
            this.reporter.sendTelemetryException(error, {
                name: eventName,
            });
        } else {
            this.reporter.sendTelemetryEvent(eventName);
        }

    }

    dispose(): void {
        this.reporter.dispose();
    }
}

function getExtensionVersion() {
    return vscode.extensions.getExtension(extensionId)?.packageJSON.version || 'unknown version';
}

/**
 * Methods to report telemetry over Application Insights (Exceptions or Custom Events).
 */
export const telemetry = new Telemetry(getExtensionVersion());
