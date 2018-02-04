const {
    spawnSync,
    spawn
} = require('child_process')
// const chalk = require('chalk')
const option = process.argv[2]
// console.log(option)
if (!option || option === "react") {
    const react = spawn('npm start', {
        shell: true,
        cwd: "./react-app",
        stdio: [process.stdin, process.stdout, process.stderr]
    })
}

if (!option || option === "flask") {
    const flask = spawnflask("")
}

function spawnflask() {
    return spawn(`flask run`, {
        // stdio: 'pipe',
        shell: true,
        cwd: "./flask-api/pcc",
        env: {
            FLASK_APP: "pcc.py",
            FLASK_DEBUG: 1,
            LC_ALL:"en_US.UTF-8",
            LANG:"en_US.UTF-8",
            NUMBER_OF_PROCESSORS: process.env['NUMBER_OF_PROCESSORS'],
            PATH:process.env.PATH
        }, // For multiprocessing which PyPower uses
        stdio: [process.stdin, process.stdout, process.stderr]        
    })
}