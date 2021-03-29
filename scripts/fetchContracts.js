const fs = require('fs-extra');
const { exit } = require("process");

const addressesSrcPath = "../contracts/contractAddresses.json";
const addressesDestPath = "./src/contracts/contractAddresses.json";
const srcPath = "../contracts/build/contracts";
const destPath = "./src/contracts";

if (!fs.existsSync(srcPath)) {
  console.error(`${srcPath} does not exist`);
  exit(1);
}

fs.ensureDirSync(destPath);
fs.emptyDirSync(destPath);
fs.copySync(srcPath, destPath,
  {
    preserveTimestamps: true
  });

fs.copySync(addressesSrcPath, addressesDestPath,
  {
    preserveTimestamps: true
  });

const jsonFiles = fs.readdirSync(destPath);

jsonFiles.forEach((file) => {
  if (file !== "contractAddresses.json") {
    const fileSpec = `${destPath}/${file}`;
    const abi = fs.readJsonSync(fileSpec).abi;
    fs.writeJsonSync(`${destPath}/${file}`, { abi: abi });
  }
});

exit(0);
