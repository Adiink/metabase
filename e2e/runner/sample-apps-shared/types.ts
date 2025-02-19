export type SampleAppName =
  | "metabase-nodejs-react-sdk-embedding-sample"
  | "metabase-nextjs-sdk-embedding-sample"
  | "shoppy";

export type EmbeddingSdkVersion = string | "local" | undefined;

export type SampleAppSetupConfig = {
  subAppName?: string;
  defaultBranch: string;
  env: Record<string, string | number>;
  additionalSetup?: (data: {
    installationPath: string;
    loggerPrefix: string;
  }) => void;
  startCommand: string[];
};

export type SampleAppSetupConfigs<
  TSampleAppSetupConfig extends SampleAppSetupConfig = SampleAppSetupConfig,
> = Partial<Record<SampleAppName, TSampleAppSetupConfig[]>>;
