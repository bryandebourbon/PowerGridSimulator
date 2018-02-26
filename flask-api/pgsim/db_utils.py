import sqlite3
from flask import Blueprint, request, session, g, redirect, url_for, abort, \
     render_template, flash, current_app, jsonify
import firebase_admin
from firebase_admin import auth, credentials, db

cred = credentials.Certificate('pgsim/data/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://power-grid-simulator.firebaseio.com"
    })
TEAMS = db.reference('teams')
SUBMISSIONS = db.reference('submissions')
SCORES = db.reference('scores')

# Read in the teams.txt and put the team data into the database. 
def init_db_teams(authfile="pgsim/data/teams.txt"):
    team_info = []
    with open(authfile, 'r') as f:
        contents = list(f)
        for i in range(1, len(contents)):
            team_info = contents[i].split('\n')[0]
            # Will be added under teams, in node named by unique team_key.
            TEAMS.push().set({'team_id': i, 'team_name': team_info})

def get_team_id(team_name):
    team = TEAMS.order_by_child('team_name').equal_to(team_name).get()
    if not team:
        return -1
    else:
        return list(team.values())[0]['team_id']

def insert_submission_entry(gen_placements, team_id):
    submission_entry = {}
    latest_sub = SUBMISSIONS.order_by_child('submission_id').limit_to_last(1).get()
    if latest_sub:
        submission_id = list(latest_sub.values())[0]['submission_id'] + 1
    else:
        submission_id = 0

    submission_entry['submission_id'] = submission_id
    submission_entry['team_id'] = team_id
    submission_entry['submission_info'] = gen_placements

    SUBMISSIONS.push().set(submission_entry)
    return submission_id
    
def update_scores_entry(submission_id, new_sys_info, team_id, new_scores):
    new_scores_entry = {}
    new_scores_entry['submit_id_best'] = submission_id
    new_scores_entry['num_attempts'] = new_sys_info['new_num_attempts']
    new_scores_entry['last_submit_success_time'] = new_sys_info['new_sub_datetime']
    new_scores_entry['team_id'] = team_id    
    new_scores_entry['scores_best'] = new_scores
    
    score = SCORES.order_by_child('team_id').equal_to(team_id).get()
    if score:
        SCORES.child(team_id).update(new_scores_entry)
    else:
        SCORES.push().set(new_scores_entry)

def get_scores_status_entry(team_id):
    score = SCORES.order_by_child('team_id').equal_to(team_id).get()
    if not score:
        return {
            'team_id': None,
            'submit_id_best': None,
            'scores_best': None,
            'num_attempts': None,
            'last_submit_success_time': None
        }

    return list(score.values())[0]

# TODO: metrics for best score
def get_best_scores(current_best, new_scores):
    new_best = current_best
    return new_best

# TODO(Mel): Leaderboard functions
# TODO(Mel): Display previous entry and add the ability to pull one up 

# The following functions are example operations that the front-end can call.
# The specific route and methods will be modified to reflect frontend's real needs.
# The code will also be modified to work with firebase.
# TODO(Mel) 
def register_routes(current_app):
    '''
    @current_app.route('/')
    def show_entries():
        # An example of showing some current db entries.
        # firebase does not do desc order, have to reverse on client's side
        teams = TEAMS.order_by_child('team_id').get()
        return render_template('show_entries.html', entries=list(teams.values()))

    @current_app.route('/add', methods=['POST'])
    def add_entry():
        # An example of updating the database.
        error = None
        team_name = request.headers["username"]
        team = TEAMS.order_by_child('team_name').equal_to(team_name).get()
        if team:
            error = 'Team name already exists.' # TODO: properly return this??
        
        team_id = TEAMS.order_by_child('team_id').limit_to_first(1).get()
        TEAMS.push().set({
            'team_id': list(team_id.values())[0] + 1,
            'team_name': team_name
        })
        flash('New entry was successfully posted')
        return redirect(url_for('show_entries'))
    '''
    return
