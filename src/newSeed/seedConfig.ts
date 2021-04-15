export interface ISeedConfig {
  stage1: {
    projectName: string,
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,
    verified: boolean,
  },
  stage2: {
    summary: string,
    proposition: string,
    category: string,
    verified: boolean,
  }

}

export class SeedConfig implements ISeedConfig {
  stage1: {
    projectName: string
    projectWebsite: string,
    category: string,
    whitepaper: string,
    github: string,
    verified: boolean
  };
  stage2: {
    summary: string,
    proposition: string,
    category: string,
    verified: boolean
  }
}
