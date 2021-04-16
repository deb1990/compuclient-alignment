const execSync = require('child_process').execSync;
const yaml = require('js-yaml');
const fs   = require('fs');
const _ = require('lodash');

const oldCompuclientVersion = '7.x-1.15'; // CHANGE THIS
const newCompuclientVersion = '7.x-1.20'; // CHANGE THIS
const extentionsFolderPath = '/var/www/script/ext'; // CHANGE THIS
const modulesFolderPath = '/var/www/script/mod'; // CHANGE THIS

const githubToken = '<create a github personal access token and paste here>'; // CHANGE THIS
const makeFileName = 'compuclient.make.yml';
const githubURL = `https://${githubToken}@raw.githubusercontent.com/compucorp/compuclient`;

const oldFileDownloadCmd = `curl ${githubURL}/${oldCompuclientVersion}/${makeFileName} -o old-${makeFileName}`;
const newFileDownloadCmd = `curl ${githubURL}/${newCompuclientVersion}/${makeFileName} -o new-${makeFileName}`;

downloadFile(oldFileDownloadCmd);
downloadFile(newFileDownloadCmd);

const oldFile = readFile(`old-${makeFileName}`);
const newFile = readFile(`new-${makeFileName}`);

const newExtentions = getNewExtensions();
const updatedExtentions = getUpdatedExtentions();
const newModules = getNewModules();
const updatedModules = getUpdatedModules();

// Download new extentions
_.each(newExtentions, function (extention, key) {
  execSync(`./download-extension-zip.sh ${key} ${extention.download.url} ${extentionsFolderPath}`);
});

// // Replace updated extentions
_.each(updatedExtentions, function (extention, key) {
  execSync(`./download-extension-zip.sh ${key} ${extention.download.url} ${extentionsFolderPath}`);
});

// Download new module
_.each(newModules, function (moduleObj, key) {
  if (moduleObj.version) {
    execSync(`drush dl ${key}-7.x-${moduleObj.version} --destination="${modulesFolderPath}" -y`);
  }
});

// Replace updated modules
_.each(updatedModules, function (moduleObj, key) {
  if (moduleObj.version) {
    execSync(`drush dl ${key}-7.x-${moduleObj.version} --destination="${modulesFolderPath}" -y`);
  } else if (moduleObj.download.url.endsWith('.zip')) {
    execSync(`./download-extension-zip.sh ${key} ${moduleObj.download.url} ${modulesFolderPath}`);
  } else if (moduleObj.download.url.endsWith('.tar.gz')) {
    execSync(`./download-extension-tar.sh ${key} ${moduleObj.download.url} ${modulesFolderPath}`);
  }
});


// tag support
//commit

function getNewExtensions () {
  return _.pickBy(newFile.libraries, function (obj, key) {
    return !oldFile.libraries[key];
  });
}

function getNewModules () {
  return _.pickBy(newFile.projects, function (obj, key) {
    return obj && (obj.version || obj.download) && !oldFile.projects[key];
  });
}

function getUpdatedModules () {
  return _.pickBy(newFile.projects, function (obj, key) {
    var moduleObj = oldFile.projects[key];

    if (moduleObj) {
      if (moduleObj.version) {
        return obj.version !== moduleObj.version;
      } else {
        return obj.download.url !== moduleObj.download.url;
      }
    }
  });
}

function getUpdatedExtentions () {
  return _.pickBy(newFile.libraries, function (obj, key) {
    var extention = oldFile.libraries[key];

    if (extention) {
      if (extention.download.tag) {
        return obj.download.tag !== extention.download.tag;
      } else {
        return obj.download.url !== extention.download.url;
      }
    }
  });
}

function downloadFile (cmd) {
  execSync(cmd);
}

function readFile (path) {
  try {
    const doc = yaml.load(fs.readFileSync(path, 'utf8'));
    return doc;
  } catch (e) {
    console.log(e);
  }
}
