import sqlite3
from flask import Blueprint, request, session, g, redirect, url_for, abort, \
     render_template, flash, current_app
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
            TEAMS.push().set({'team_id': str(i), 'team_name': team_info})

def get_team_id(team_name):
    team = TEAMS.order_by_child('team_name').equal_to(team_name).get()
    if not team:
        return -1
    else:
        return list(team.values())[0]['team_id']

def insert_submission_entry(gen_placements, team_id):
    # TODO: add challenge_id
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
    new_scores_entry['scores_best'] = new_scores

    score = SCORES.child(str(team_id))
    if score:
        SCORES.child(str(team_id)).update(new_scores_entry)
    else:
        SCORES.child(str(team_id)).set(new_scores_entry)

def get_scores_status_entry(team_id):
    score = SCORES.order_by_child('team_id').equal_to(team_id).get()
    if not score:
        return {
            'team_id': None,
            'submit_id_best': None,
            'scores_best': None,
            'num_attempts': 0,
            'last_submit_success_time': None
        }

    return list(score.values())[0]

def get_best_scores(current_best, new_scores):
    if new_scores['score'] > current_best['score']:
        return new_scores
    return current_best

# Leaderboard functions to display top 3 teams in different categories.
def get_leaderboard():
    """
    Returns a dictionary in the follwing format, teams in names:
        {
          cat1: {
            team1: val1, # best team
            team2: val2, # second team
            team3: val3  # third team
          },
          cat2: {
            team1: val1,
            team2: val2,
            team3: val3
          }
        }
    """
    result, passed_teams = {}, {}
    passed_teams = SCORES.order_by_child('scores_best/passed').equal_to(True).get()
    passed_scores = {}
    # get 'scores_best' for every passed team
    for team_id in passed_teams:
        passed_scores[team_id] = passed_teams[team_id]['scores_best']
        if result == {}:
            for cat in passed_scores[team_id]:
                if cat == 'lines' or cat == 'nodes' or cat == 'passed':
                    continue
                result[cat] = {}

    # get top 3 for each category by sorting the values
    for cat in result:
        if cat == 'lines' or cat == 'nodes' or cat == 'passed':
            continue
        # All current categories are the lower the better.
        top_teams = sorted(passed_scores, key=lambda x: passed_scores[x][cat])
        if len(top_teams) > 3:
            top_teams = top_teams[:3]
        # convert ids into names and put them into result.
        for team_id in top_teams:
            team = TEAMS.order_by_child('team_id').equal_to(team_id).get()
            team_name = list(team.values())[0]['team_name']
            result[cat][team_name] = passed_scores[team_id][cat]
    
    return result

# TODO(Mel): Display previous entry and add the ability to pull one up 

# TODO(Mel): Given the id of the challenge, check if the currently signed-in
# team has their work saved for this challenge or not. 
def is_saved(id):
    return False

# The following functions are example operations that the front-end can call.
# The specific route and methods will be modified to reflect frontend's real needs.
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


if __name__ == "__main__":
    # init_db_teams()
    # print(get_team_id("yourteam"))
    # print(insert_submission_entry([{'node': 0, 'generators': {} },
    #         {'node': 1, 'generators': {'H': 1}},
    #         {'node': 2, 'generators': {"N": 1}},
    #         {'node': 3, 'generators': {'H': 1, "N": 1, "R": 1}} ], 3))
    # update_scores_entry(1, new_sys_info = {
    #    'new_sub_datetime': '2018-03-09 14:20:18',
    #    'new_num_attempts': 1}, 
    #    team_id=3, new_scores={"cost": 6120.23, 
    #                             "passed": True, 
    #                             "score": 6120.23,
    #                             "CO2": 10000.41, 
    #                             "installation_cost": 523081,
    #                             "lines": {0: {'from': 0}},
    #                             "nodes": {0: {'node':0}}})
    # print(get_scores_status_entry(3))
    # print(get_scores_status_entry(10))
    print(get_leaderboard())
