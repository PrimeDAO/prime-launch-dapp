export function getRouterViewViewModel(selector: string) {
  return cy.get(selector)
    .closest("router-view")
    .then(($routerView) => {
      const viewModel =
        // @ts-ignore
        $routerView[0].au.controller.viewModel.view.controller.viewModel;

      return (viewModel)
    });
}
