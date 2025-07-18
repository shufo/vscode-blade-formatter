import { spawnSync } from "child_process";
import { randomBytes } from "crypto";
import fs from "fs";
import { platform, tmpdir } from "os";
import path, { dirname } from "path";

import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";

const VSCODE_VERSION = process.env.VSCODE_VERSION;

async function main() {
	try {
		// vscode version
		const version = VSCODE_VERSION;
		const codePath = await downloadAndUnzipVSCode(version);

		console.log(`Using VS Code at ${codePath}`);

		const codeExecPath = path.resolve(codePath, "../", "bin", "code");

		const extensionsDir = getExtensionsDir();

		const extensionsDirArgs = ["--extensions-dir", extensionsDir];
		// The path to the extension test script
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, "./suite/index");

		const packagePath = makePackagePath();

		// create .vsix package
		await createPackage(packagePath);

		await installExtension(codeExecPath, packagePath, extensionsDirArgs);

		const launchArgs = [
			`${path.resolve(
				__dirname,
				"../../src",
			)}/test/fixtures/test.code-workspace`,
			...extensionsDirArgs,
		];

		// Download VS Code, unzip it and run the integration test
		await runTests({
			version,
			extensionDevelopmentPath: "./support", // set directory that has no package.json
			extensionTestsPath,
			launchArgs,
		});
	} catch (err) {
		console.error("Failed to run tests");
		process.exit(1);
	}
}

function makePackagePath(): string {
	const packageJsonPath = path.resolve(__dirname, "../../package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const packageName = packageJson.name;
	const packageVersion = packageJson.version;

	const packagePath = path.resolve(
		tmpdir(),
		`${packageName}-${packageVersion}.vsix`,
	);

	return packagePath;
}

async function createPackage(packagePath: string) {
	const result = spawnSync("yarn", ["run", "package", "--out", packagePath, "--allow-package-env-file"]);

	if (result.status === 0) {
		console.log("Package command succeeded");
		console.log(result.stdout.toString());
	} else {
		console.error("Package command failed");
		console.error(result.stderr.toString());
	}
}

async function installExtension(
	executablePath: string,
	packagePath: string,
	args: string[],
) {
	const result = spawnSync(executablePath, [
		"--install-extension",
		packagePath,
		...args,
	]);

	if (result.status === 0) {
		console.log("install package succeeded");
		console.log(result.stdout.toString());
	} else {
		console.error("install package failed");
		console.error(result.stderr.toString());
	}
}

function getExtensionsDir(): string {
	const randomBytesStr = randomBytes(4).toString("hex");
	const extensionsDir = `${tmpdir()}/extensions_${randomBytesStr}`;

	console.log(`Using extensions dir: ${extensionsDir}`);

	return extensionsDir;
}

main();
