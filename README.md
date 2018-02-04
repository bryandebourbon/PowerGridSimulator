# pcc-web
Web interface for the IEEE U of T Power Case Competition.

## To download and run:

<code>git clone https://github.com/bryandebourbon/PowerGridSimulator.git (new version)</code>
<br>
<code>cd ./PowerGridSimulator</code>
<br>
<code>git checkout dev</code>

### The short way
After you clone the repository, open the terminal in /pcc-web directory, run
<br>
<code>node setup.js</code>(first time setup)
<br>
<code>node run.js</code>

### The long way
**Run Flask Only**
<br>
<code>FLASK_APP=./flask-api/pcc-api.py flask run</code>

**Run React Only**
<br>
<code>cd ./react-app</code>
<br>
<code>npm install</code> (only needed the first time)
<br>
<code>npm start</code>

## System block diagram

![alt text](./pcc_web_blockdiagram_recent.png)
