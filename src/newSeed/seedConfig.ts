export interface ISeedConfig {
  general: {
    projectName: string,
  },
  projectDetails: {
    summary: string,
  }

}

export class SeedConfig implements ISeedConfig {
  general: {
    projectName: string
  };
  projectDetails: {
    summary: string
  }
}
