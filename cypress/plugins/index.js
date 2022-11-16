// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/* eslint-disable */
const { ProvidePlugin } = require("webpack");
const webpack = require("@cypress/webpack-preprocessor");

module.exports = (on, config) => {
  // bind to the event we care about
  // on('<event>', (arg1, arg2) => {
  //   // plugin stuff here
  // });
  on(
    "file:preprocessor",
    webpack({
      webpackOptions: {
        resolve: {
          extensions: [".ts", ".js"],
          alias: {
            process: "process/browser",
          },
        },
        devtool: "cheap-module-source-map",
        devServer: {
          client: {
            overlay: false,
          },
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              exclude: [/node_modules/],
              use: [
                {
                  loader: "ts-loader",
                },
              ],
            },
            {
              test: /\.feature$/,
              use: [
                {
                  loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                  options: config,
                },
              ],
            },
          ],
        },
        plugins: [
          new ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
          }),
        ],
      },
    }),
  );

  // on("task", {
  //   async addSeed(...args) {
  //     // 1. Get SeedFactory instance

  //     /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: index.js ~ line 70 ~ args', args)

  //     // Now we can run a script and invoke a callback when complete, e.g.

  //     // var relativePath = "tasks/testMgmt.js"
  //     var relativePath = "../../../launch-contracts/tasks/testMgmt.js"
  //     // const absolutePath = "/home/hdn/dev/prime/launch-contracts/tasks/testMgmt.js";
  //     // try {

  //     // } catch (error) {
  //     //   return error;
  //     // }
  //     return "okay";
  //   },
  // });

  // require('@cypress/code-coverage/task')(on, config)
  return config;
};
