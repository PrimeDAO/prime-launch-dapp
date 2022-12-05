import packageJson from "../../package.json";

export class AppVersion {
  private commitHash: string;
  private appVersion = packageJson.version;

  attached() {
    // @ts-ignore
    this.commitHash = COMMIT_HASH;
  }
}
