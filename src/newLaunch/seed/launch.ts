import { PLATFORM } from "aurelia-pal";
import { singleton, computedFrom, useView } from "aurelia-framework";
import { ISeedConfig, SeedConfig } from "newLaunch/seed/config";
import { Router, RouterConfiguration, RouteConfig } from "aurelia-router";
import { IStageState, IWizardState } from "newLaunch/baseStage";
import { LaunchType } from "services/launchTypes";
import { SeedService } from "services/SeedService";
import { EventAggregator, Subscription } from "aurelia-event-aggregator";

/**
 * this is the max "real" stage that gathers input from the user and requires
 * validatation of inputs. Reminder that stages are one-indexed.
 */
const maxStage = 5;

@useView(PLATFORM.moduleName("../launch.html"))
@singleton(false)
export class NewSeed {
  router: Router;
  launchConfig: ISeedConfig;
  stageStates: Array<IStageState>;
  wizardState: IWizardState;
  sideBar: HTMLElement;
  subscriptions: Subscription[] = []

  @computedFrom("router.currentInstruction")
  get currentStage(): RouteConfig {
    return this.router.currentInstruction.config;
  }

  constructor(private seedService: SeedService, private eventAggregator: EventAggregator) {
    if (!this.launchConfig) {
      this.launchConfig = new SeedConfig();
      this.dev_initSeedConfigFromLocalStorage();

      this.wizardState = { launchType: LaunchType.Seed, launchTypeTitle: "Seed" };
      /**
       * stageStates is 1-based, indexed by stage number
       */
      this.stageStates = [
        undefined,
        {
          verified: false,
          title: "General Information",
        },
        {
          verified: false,
          title: "Project Details",
        },
        {
          verified: false,
          title: "Token Details",
        },
        {
          verified: false,
          title: "SEED Details",
        },
        {
          verified: false,
          title: "Contact Details",
        },
        {
          verified: true,
          title: "Seed Summary",
        },
        {
          verified: true,
          title: "Ready to Go!",
        },
        {
          verified: true,
          title: "Thank you!",
        },
      ];
    }
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    const routes = [
      {
        route: ["", "stage1"],
        nav: true,
        moduleId: PLATFORM.moduleName("newLaunch/stages/stage1"),
        name: "stage1",
        title: this.stageStates[1].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 1,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage2"],
        nav: true,
        moduleId: PLATFORM.moduleName("newLaunch/stages/stage2"),
        name: "stage2",
        title: this.stageStates[2].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 2,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage3"],
        nav: true,
        moduleId: PLATFORM.moduleName("newLaunch/stages/stage3"),
        name: "stage3",
        title: this.stageStates[3].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 3,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage4"],
        nav: true,
        moduleId: PLATFORM.moduleName("newLaunch/seed/stages/stage4"), // seed specific stage
        name: "stage4",
        title: this.stageStates[4].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 4,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage5"],
        nav: true,
        moduleId: PLATFORM.moduleName("newLaunch/stages/stage5"),
        name: "stage5",
        title: this.stageStates[5].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 5,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage6"],
        nav: false,
        moduleId: PLATFORM.moduleName("newLaunch/seed/stages/stage6"), // seed specific stage
        name: "stage6",
        title: this.stageStates[6].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 6,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage7"],
        nav: false,
        moduleId: PLATFORM.moduleName("newLaunch/seed/stages/stage7"), // seed specific stage
        name: "stage7",
        title: this.stageStates[7].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 7,
          maxStage,
          wizardState: this.wizardState,
        },
      },
      {
        route: ["stage8"],
        nav: false,
        moduleId: PLATFORM.moduleName("newLaunch/stages/stage8"),
        name: "stage8",
        title: this.stageStates[8].title,
        settings: {
          launchConfig: this.launchConfig,
          stageStates: this.stageStates,
          stageNumber: 8,
          maxStage,
          wizardState: this.wizardState,
        },
      },
    ];

    config.map(routes);

    this.router = router;
  }

  setStage(route: string): void {
    this.router.navigate(route);
  }

  toggleSideBar(): void {
    if (this.sideBar.classList.contains("show")) {
      this.sideBar.classList.remove("show");
    } else {
      this.sideBar.classList.add("show");
    }
  }

  private dev_initSeedConfigFromLocalStorage(): void {
    this.dev_subscriteToUseSavedSeedInLocalStorage();
    this.dev_subscriteToUpdateSeedInLocalStorage();
    this.dev_subscribeToDownloadSeed();
    this.dev_subscribeToUploadSeed();

  }

  private dev_subscriteToUseSavedSeedInLocalStorage(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("dev:use-saved-seed", () => {
      const result = this.seedService.dev_getSeedConfigFromLocalStorage();
      if (result !== null) {
        this.launchConfig = { ...this.launchConfig, ...result };
        /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: stage7.ts ~ line 49 ~ this.launchConfig", this.launchConfig);

        // Update setting of each route
        this.router.routes.forEach(route => {
          const rawSeedConfig = new SeedConfig();
          route.settings.launchConfig = Object.assign(rawSeedConfig, this.launchConfig);
        });

        this.router.navigate("/newSeed/stage6");
      }
    }));
  }

  private dev_subscriteToUpdateSeedInLocalStorage(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("dev:update-seed", () => {
      this.seedService.dev_setSeedConfigFromLocalStorage(this.launchConfig);
    }));
  }

  private dev_subscribeToDownloadSeed(): void {
    function getRandomId (){
      /**
       * "0.g6ck5nyod4".substring(2, 9)
       * -> g6ck5ny
       */
      return Math.random().toString(36).substring(2, 9);
    }

    function download(content: string) {
      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
      element.setAttribute("download", `Generated_Seed_${getRandomId()}.json`);

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    }

    this.subscriptions.push(this.eventAggregator.subscribe("dev:download-seed", () => {
      this.seedService.dev_setSeedConfigFromLocalStorage(this.launchConfig);
      const stringify = JSON.stringify(this.launchConfig, null, 4);
      download(stringify);
    }));
  }

  private dev_subscribeToUploadSeed(): void {
    this.subscriptions.push(this.eventAggregator.subscribe("dev:upload-seed", (seedJson: ISeedConfig) => {
      this.launchConfig = seedJson;
      this.seedService.dev_setSeedConfigFromLocalStorage(this.launchConfig);
      window.location.reload();
    }));
  }

  private detached(): void {
    this.subscriptions.forEach(sub => sub.dispose());
  }
}
