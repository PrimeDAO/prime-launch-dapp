export interface ISeedConfig {
  general: {
    projectName: string,
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,
    verified: boolean,
  },
  projectDetails: {
    summary: string,
    proposition: string,
    category: string,
    verified: boolean,
  }

}

export class SeedConfig implements ISeedConfig {
  general: {
    projectName: string
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,
    verified: boolean
  };
  projectDetails: {
    summary: string,
    proposition: string,
    category: string,
    verified: boolean
  }
}
