const { spawnSync } = require('child_process')
const fs = require('fs')
let changed = false;
if (!fs.readdirSync('./').includes('node_modules') || !fs.readdirSync('./node_modules').includes('chalk')) {
    // if chalk uninstalled
    console.log('chalk not found, installing chalk')
    spawnSync('npm install', {
        stdio: 'inherit',
        shell: true,
    })
    console.log('chalk installation success')
    changed = true
}
if (!fs.readdirSync('./react-app').includes('node_modules') || !fs.readdirSync('./react-app/node_modules').includes('react-scripts')) {
    // if react script uninitialized
    console.log('react-scripts not found, installing react-scripts')
    spawnSync('npm install', {
        stdio: 'inherit',
        shell: true,
        cwd: "./react-app"
    })
    console.log('react installation success')
    changed = true
}
console.log(changed ? 'installation complete\nrun node run.js to start' : "you are already setup, run node run.js to start")