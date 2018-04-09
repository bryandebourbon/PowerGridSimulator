# PowerGridSimulator

To run:
```
cd front/pgs/
python3 -m http.server 
cd ../../back/
export FLASK_APP=pgsim.py
flask run
```
The website will be live at http://0.0.0.0:8000/!

## Set Up Your Own Database
If you are a competition organizer or teacher for a larger class, and would like to monitor students' submissions, scores and rankings, this section can help you set up your own database on Firebase using your Google account.

Instructions on how to install the Admin SDK can be found at https://firebase.google.com/docs/admin/setup, which the following instructions show how to integrate with this simulator.

1. Create a Firebase project in the Firebase console (https://console.firebase.google.com/), and click on "Add Project". 
2. Click on "Add Firebase to your web app", and copy the config code snippet. Then use it to:
	1. Replace the config in `/front/pgs/helper.js`.
	2. Replace the `databaseURL` field in `/back/db_utils.py`.
3. Download a JSON file with your service account credentials, and changne the path for `cred` in `/back/db_utils.py`.
4. Add registered team or student names (one name per line) into a `teams.txt` file and put to `/back/data/teams.txt`
3. Run `python /back/db_utils.py` to run the `init_db_teams` function, which puts the registered teams into the database.

That's all the set up! Now when users submit their solutions, you can view them in the database in real time!