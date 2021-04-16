# How to Run

Edit the following values in `index.js`.
```javascript
const oldCompuclientVersion = '7.x-1.15'; // Put the Compuclient version with which the client site was last aligned with
const newCompuclientVersion = '7.x-1.20'; // Put the Compuclient version of the new compuclient version
const extentionsFolderPath = '/var/www/script/ext'; // path to the folder, where all the extentions are present
const modulesFolderPath = '/var/www/script/mod'; // path to the folder, where all the modules are present
const githubToken = '<create a github personal access token and paste here>'; // CHANGE THIS
```

Run using `node index.js`.

