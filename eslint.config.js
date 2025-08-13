import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

export default [
  {
    ignores: ["node_modules", ".nuxt", ".output", "dist"], // 무시할 디렉토리
  },
  // TypeScript/JavaScript 파일용 설정
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // 기본 규칙
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-explicit-any": "off", // any 타입 허용
      "import/no-unresolved": "off",
      "import/extensions": "off",
      // 추가 완화 규칙
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  // Vue 파일용 설정
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2021,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
    plugins: {
      vue: vuePlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Vue 규칙
      "vue/multi-word-component-names": "off", // 단일 단어 컴포넌트명 허용
      "vue/no-v-html": "off", // v-html 사용 허용
      "vue/require-default-prop": "off", // default prop 필수 규칙 해제
      
      // TypeScript 규칙
      "@typescript-eslint/no-unused-vars": ["warn"],
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
      
      // 추가 완화 규칙
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
];