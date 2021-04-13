export interface ISeedConfig {
  general: {
    projectName: string,
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,

  },
  projectDetails: {
    summary: string,
  }

}

export class SeedConfig implements ISeedConfig {
  general: {
    projectName: string
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,
  };
  projectDetails: {
    summary: string
  }
}
