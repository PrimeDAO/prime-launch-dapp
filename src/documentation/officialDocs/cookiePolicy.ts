import { singleton } from "aurelia-framework";

@singleton(false)
export abstract class cookiePolicy {
  activate(): void {
    window.location.href = "https://assets.website-files.com/608bd350d67fe62ab7818c74/619b9c4ae6d73869fac95783_Prime%20-%20Cookie%20Policy.pdf";
  }
}
