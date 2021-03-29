import { bootstrap } from "aurelia-bootstrapper";
import { StageComponent } from "aurelia-testing";
import { PLATFORM } from "aurelia-pal";

describe("Stage App Component", () => {
  let component;

  beforeEach(() => {
    component = StageComponent
      .withResources(PLATFORM.moduleName("app"))
      .inView("<app></app>");
  });

  afterEach(() => component.dispose());

  it("should show home page", done => {
    component.create(bootstrap).then(async () => {
      // const view = component.element;
      const homeElement = document.querySelector(".home");
      expect(homeElement).toBeDefined();
      // expect(view.textContent.trim()).toBe("primepool.eth!");
      done();
    }).catch(e => {
      fail(e);
      done();
    });
  });
});
