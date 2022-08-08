import assert from "assert";
import path from "path";
import fs from "fs";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import vscode, { TextDocument } from "vscode";
import { before } from "mocha";
import { ExtensionConstants } from "../../constants";
import { formatSameAsBladeFormatter, getContent, getDoc } from "../support/util";
// const myExtension = require('../extension');

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    test("Should format file with extension", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "index.blade.php",
            "formatted.index.blade.php"
        );
    });

    test("Should ignore file if target listed in .bladeignore", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "ignore.blade.php",
            "ignore.blade.php"
        );
    });

    test("Should format file with runtime config / indentSize", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/indentSize/index.blade.php",
            "withConfig/indentSize/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / wrapAttributes", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/wrapAttributes/index.blade.php",
            "withConfig/wrapAttributes/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / wrapLineLength", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/wrapLineLength/index.blade.php",
            "withConfig/wrapLineLength/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / sortTailwindcssClasses", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/sortTailwindcssClasses/index.blade.php",
            "withConfig/sortTailwindcssClasses/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / sortHtmlAttributes", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/sortHtmlAttributes/index.blade.php",
            "withConfig/sortHtmlAttributes/formatted.index.blade.php"
        );
    });

    test("Should format file with runtime config / noMultipleEmptyLines", async function (this: any) {
        this.timeout(20000);
        await formatSameAsBladeFormatter(
            "withConfig/noMultipleEmptyLines/index.blade.php",
            "withConfig/noMultipleEmptyLines/formatted.index.blade.php"
        );
    });

    test("Format command exists in command list", async function () {
        const commands = await vscode.commands.getCommands();
        assert(commands.includes(ExtensionConstants.formatCommandKey));
    });

    test("Format command", async function () {
        const doc = await getDoc("index.blade.php");
        await vscode.commands.executeCommand(ExtensionConstants.formatCommandKey);
        const formatted = await doc.getText();
        const expected = await getContent("project", "formatted.index.blade.php");

        assert.equal(formatted, expected);
    });
});
