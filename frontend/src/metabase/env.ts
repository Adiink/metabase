const tryOrDefault = <T>(fn: () => T, defaultValue: T): T => {
  try {
    return fn();
  } catch (e) {
    console.warn(
      "Error while trying to get env",
      e,
      `returning default: ${defaultValue}`,
    );
    return defaultValue;
  }
};

export const isCypressActive = tryOrDefault(
  // @ts-expect-error window.Cypress is not typed
  () => typeof window !== "undefined" && !!window.Cypress,
  false,
);

export const isStorybookActive = tryOrDefault(
  () => !!process.env.STORYBOOK,
  false,
);

export const isProduction = tryOrDefault(
  () => process.env.WEBPACK_BUNDLE === "production",
  false,
);

export const isTest = tryOrDefault(
  () => process.env.NODE_ENV === "test",
  false,
);

export const shouldLogAnalytics = tryOrDefault(
  () => process.env.MB_LOG_ANALYTICS === "true",
  false,
);

export const isChartsDebugLoggingEnabled = tryOrDefault(
  () => process.env.MB_LOG_CHARTS_DEBUG === "true",
  false,
);

export const isEmbeddingSdk = tryOrDefault(
  () => !!process.env.IS_EMBEDDING_SDK,
  false,
);
