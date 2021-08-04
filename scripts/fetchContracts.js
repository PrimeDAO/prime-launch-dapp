const fs = require('fs-extra');
var glob = require("glob");
var path = require("path")
const { exit } = require("process");
const addressesSrcPath = "../contracts-v2/contractAddresses.json";
const addressesDestPath = "./src/contracts/contractAddresses.json";
const srcPath = "../contracts-v2/build/artifacts";
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
  if (file.indexOf("build-info") === -1) {
  fs.copySync(file, `${destPath}/${path.basename(file)}`,
    {
      preserveTimestamps: true
    });
  }
});


const jsonFiles = fs.readdirSync(destPath);

jsonFiles.forEach((file) => {
  const fileSpec = `${destPath}/${file}`;
  const abi = fs.readJsonSync(fileSpec).abi;
  fs.writeJsonSync(`${destPath}/${file}`, { abi: abi });
});

fs.copySync(addressesSrcPath, addressesDestPath,
  {
    preserveTimestamps: true
  });

fs.copySync(gnosisServiceFilePath, gnosisServiceDestPath);

exit(0);
