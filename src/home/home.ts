import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Seed } from "entities/Seed";

@singleton(false)
@autoinject
export class Home {

  seeingMore = false;
  bookmark: string;
  seeds: Array<Seed>;

  constructor(
    private router: Router,
    private seedService: SeedService,
  ) {
  }

  async activate(params: { bookmark?: string}): Promise<void> {
    this.bookmark = params?.bookmark;
  }

  async attached(): Promise<void> {
    if (this.bookmark) {
      document.getElementById(this.bookmark).scrollIntoView();
      this.bookmark = undefined;
    }

    await this.seedService.ensureInitialized();
    this.seeds = this.seedService.seedsArray;
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  seeMore(yesNo: boolean): void {
    this.seeingMore = yesNo;
  }
}
