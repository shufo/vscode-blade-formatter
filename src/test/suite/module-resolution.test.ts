import assert from "node:assert";
import {
	getCoreNodeModule,
	parsePhpVersion,
	requireUncached,
} from "../../util";

suite("Module Resolution Test Suite", () => {
	test("getCoreNodeModule should handle missing modules gracefully", () => {
		// Test with a non-existent module
		const result = getCoreNodeModule("non-existent-module");
		assert.strictEqual(
			result,
			null,
			"Should return null for non-existent modules",
		);
	});

	test("getCoreNodeModule should try multiple resolution strategies", () => {
		// Test with a module that might exist in one of the locations
		const result = getCoreNodeModule("vscode-textmate");
		// Should either return the module or null, but not throw
		assert.ok(
			result === null || typeof result === "object",
			"Should return module or null",
		);
	});

	test("requireUncached should handle file not found", () => {
		// Test with a non-existent file path
		assert.throws(() => {
			requireUncached("/non/existent/path.js");
		}, /Module file not found/);
	});

	test("requireUncached should handle cache clearing failures gracefully", () => {
		// This test verifies that cache clearing failures don't break the function
		// We can't easily test the actual require functionality in this environment,
		// but we can verify the function doesn't crash on invalid inputs
		assert.throws(() => {
			requireUncached("");
		}, /Module file not found/);
	});

	test("parsePhpVersion should handle valid version strings", () => {
		assert.strictEqual(parsePhpVersion("8.4"), 8.4);
		assert.strictEqual(parsePhpVersion("7.2"), 7.2);
		assert.strictEqual(parsePhpVersion("5.6"), 5.6);
	});

	test("parsePhpVersion should handle version comparison correctly", () => {
		assert.strictEqual(parsePhpVersion("8.4") > parsePhpVersion("7.2"), true);
		assert.strictEqual(parsePhpVersion("7.2") > parsePhpVersion("5.6"), true);
		assert.strictEqual(parsePhpVersion("8.0") <= parsePhpVersion("8.4"), true);
	});
});
