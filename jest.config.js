import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.(js|jsx|ts|tsx)",
    "**/*.(test|spec).(js|jsx|ts|tsx)",
  ],
  collectCoverageFrom: [
    "src/app/components/*.{js,jsx,ts,tsx}",
    "src/lib/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/generated/**",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
  ],
  coverageThreshold: {
    // Set higher thresholds for specific well-tested files
    "./src/app/components/Timetable.tsx": {
      branches: 90,
      functions: 85,
      lines: 95,
      statements: 95,
    },
    "./src/app/components/ContextMenu.tsx": {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/app/components/RescheduleModal.tsx": {
      branches: 35,
      functions: 90,
      lines: 90,
      statements: 85,
    },
  },
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
