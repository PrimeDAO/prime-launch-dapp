import { Router } from "aurelia-router";
import { containerless } from "aurelia-framework";
import "./headerButtons.scss";

@containerless
export class HeaderButtons {

  constructor(
    private router: Router,
  ) {}

  gotoLaunches(): void {
    if ((this.router.currentInstruction.fragment === "/") || this.router.currentInstruction.fragment.indexOf("home") !== -1) {
      document.getElementById("launches").scrollIntoView();
    } else {
      this.router.navigate("/home/launches");
    }
  }
}
