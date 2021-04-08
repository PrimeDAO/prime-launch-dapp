export interface ISeedConfig {
  general: {
    projectName: string,
  }

}

export class SeedConfig implements ISeedConfig {
  general: {
    projectName: string
  };
}
