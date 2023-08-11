import type { Config } from "@jest/types";

const appRoot = require("app-root-path");

const config: Config.InitialOptions = {
    globals: {
        __basedir: appRoot.toString(),
        "ts-jest": {
            useESM: true,
        },
    },
    testMatch: ["**/__tests__/runTest.ts"],
    transform: {
        "^.+\\.(js|jsx)$": "babel-jest",
        "^.+\\.(ts|tsx)$": "ts-jest",
        "node_modules/variables/.+\\.(j|t)sx?$": "ts-jest",
    },
    transformIgnorePatterns: ["node_modules/(?!variables/.*)"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testTimeout: 10000,
    verbose: true,
    cache: false,
    preset: "ts-jest/presets/default-esm",
};

export default config;
