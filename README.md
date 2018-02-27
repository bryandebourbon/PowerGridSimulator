# Power Grid Simulator
Web interface for the IEEE U of T Power Case Competition.

## To download and run:

<code>git clone https://github.com/bryandebourbon/PowerGridSimulator.git (new version)</code>
<br>
<code>cd ./PowerGridSimulator</code>
<br>
<code>git checkout dev</code>

### First Time Setup
<code>node setup.js</code>
<br>
<code>npm install</code>
<br>
<code>pip install pypower</code>
<br>
<code>sudo pip install firebase-admin</code>
<br>
<code>python pgsim/db_utils.py</code>

### The short way
After you clone the repository, open the terminal in /pcc-web directory, run
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
<code>npm start</code>

## System block diagram

![alt text](./pcc_web_blockdiagram_recent.png)
