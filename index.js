const execSync = require('child_process').execSync;
const yaml = require('js-yaml');
const fs   = require('fs');
const _ = require('lodash');

// THE FOLLOWING VARIABLES NEEDS TO BE UPDATED
const ticketNumber = 'RSE-123';
const oldCompuclientVersion = '7.x-1.15';
const newCompuclientVersion = '7.x-1.20';
const extentionsFolderPath = '/var/www/rse/sites/all/civicrm_extensions';
const modulesFolderPath = '/var/www/rse/sites/all/modules/contrib';
const civicrmFolderPath = '/var/www/rse/sites/all/modules/';

const githubToken = '<create a github personal access token and paste here>';
// THE VARIABLES ABOVE NEEDS TO BE UPDATED

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
  commitFolder(extentionsFolderPath, key)
});

// Replace updated extentions
_.each(updatedExtentions, function (extention, key) {
  execSync(`./download-extension-zip.sh ${key} ${extention.download.url} ${extentionsFolderPath}`);
  commitFolder(extentionsFolderPath, key)
});

// Download new module
_.each(newModules, function (moduleObj, key) {
  if (moduleObj.version) {
    execSync(`drush dl ${key}-7.x-${moduleObj.version} --destination="${modulesFolderPath}" -y`);
    commitFolder(modulesFolderPath, key)
  }
});

// Replace updated modules
_.each(updatedModules, function (moduleObj, key) {
  if (key === 'civicrm') {
    execSync(`./download-extension-tar.sh ${key} ${moduleObj.download.url} ${civicrmFolderPath}`);
    commitFolder(civicrmFolderPath, key);
  } else if (moduleObj.version) {
    execSync(`drush dl ${key}-7.x-${moduleObj.version} --destination="${modulesFolderPath}" -y`);
    commitFolder(modulesFolderPath, key);
  } else if (moduleObj.download.url.endsWith('.zip')) {
    execSync(`./download-extension-zip.sh ${key} ${moduleObj.download.url} ${modulesFolderPath}`);
    commitFolder(modulesFolderPath, key);
  } else if (moduleObj.download.url.endsWith('.tar.gz')) {
    execSync(`./download-extension-tar.sh ${key} ${moduleObj.download.url} ${modulesFolderPath}`);
    commitFolder(modulesFolderPath, key);
  }
});

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

function commitFolder (path, moduleName) {
  var commitMessage = `${ticketNumber}: Update ${moduleName}`;

  try {
    execSync(`cd ${path}/${moduleName} && git add --all && git commit -m "${commitMessage}"`);
  } catch (e) {
    console.log(e);
  }
}
