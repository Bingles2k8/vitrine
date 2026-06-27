import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code worktrees/config — nested git worktrees here are full repo
    // copies; without this, ESLint lints a duplicate of the whole source tree.
    ".claude/**",
  ]),
  {
    rules: {
      // React Compiler diagnostics. When a component trips one of these the
      // compiler skips optimizing it — nothing breaks at runtime. Every current
      // hit has been reviewed and is an intentional pattern (mount-time
      // localStorage/window reads, client-only Date.now() in dashboards,
      // window.location.href navigation), so keep them visible as warnings
      // rather than failing the build.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
