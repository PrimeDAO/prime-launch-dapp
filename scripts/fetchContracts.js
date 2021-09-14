const fs = require('fs-extra');
const glob = require("glob");
const path = require("path")
const { exit } = require("process");
const srcPath = "../contracts-v2/exports";
const destPath = "./src/contracts";
const gnosisServiceFilePath = "../contracts-v2/tasks/utils/gnosis.js";
const gnosisServiceDestPath = "./src/services/GnosisService.js";

if (!fs.existsSync(srcPath)) {
  console.error(`${srcPath} does not exist`);
  exit(1);
}

fs.ensureDirSync(destPath);
fs.emptyDirSync(destPath);

const files = glob.sync(srcPath + "/**/*.json");
files.forEach(file => {
  fs.copySync(file, `${destPath}/${path.basename(file)}`,
    {
      preserveTimestamps: true
    });
});

fs.copySync(gnosisServiceFilePath, gnosisServiceDestPath);

exit(0);
