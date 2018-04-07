from collections import OrderedDict
from flask import Blueprint, request, session, g, redirect, url_for, abort, \
     render_template, flash, current_app, make_response
import os, json, firebase_admin
from firebase_admin import auth, credentials, db
from datetime import datetime

cred = credentials.Certificate(os.path.join(os.path.dirname(os.path.abspath(__file__)),
    "data/serviceAccountKey.json"))
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://power-grid-simulator.firebaseio.com"
    })
TEAMS = db.reference('teams')
SUBMISSIONS = db.reference('submissions')
SCORES = db.reference('scores')

# Read in the teams.txt and put the team data into the database. 
def init_db_teams(authfile="./data/teams.txt"):
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

def insert_submission_entry(gen_placements, team_id, new_sys_info):
    '''
    SUBMISSIONS table is structured like:
    SUBMISSIONS
      |
      -- challenge_id
            |
            -- submission_key
                    |
                    -- num_attempt
                    -- submission_id
                    -- submission_info
                    -- submission_time
                    -- team_id
    '''
    challenge_ref = SUBMISSIONS.child(new_sys_info['challenge_id'])
    latest_sub = challenge_ref.order_by_child('submission_id').limit_to_last(1).get()
    if latest_sub:
        submission_id = list(latest_sub.values())[0]['submission_id'] + 1
    else:
        submission_id = 0

    sub_entry = {}
    sub_entry['num_attempt'] = new_sys_info['new_num_attempts']
    sub_entry['submission_id'] = submission_id
    sub_entry['submission_info'] = gen_placements
    sub_entry['submission_time'] = new_sys_info['new_sub_datetime']
    sub_entry['team_id'] = team_id

    challenge_ref.push().set(sub_entry)

    return submission_id

# TODO(Mel): Display previous entry and add the ability to pull one up 

def get_saved_challenge(challenge_id, team_id):
    """
    Check if the team has submitted this challenge before. 
    If yes return the latest submission, else return default.
    """
    result = {
                'num_attempt': 0,
                'submission_id': 0,
                'submission_info': None,
                'submission_time': None,
                'team_id': None
            }
    challenge_ref = SUBMISSIONS.child(str(challenge_id))
    team_subs = challenge_ref.order_by_child('team_id').equal_to(int(team_id)).get()

    latest_time = datetime.strptime("1000-01-01 01:01:01", "%Y-%m-%d %H:%M:%S")
    for sub in team_subs.values():
        dt = datetime.strptime(sub['submission_time'], "%Y-%m-%d %H:%M:%S")
        if dt > latest_time:
            result = sub
            latest_time = dt

    return result
    
def insert_scores_entry(challenge_id, submission_id, team_id, new_scores):
    '''
    SCORES table is structured like:
    SCORES
      |
      -- challenge_id
            |
            -- submission_id
                    |
                    -- evals
                        |
                        -- CO2 (float)
                        -- cost (float)
                        -- installation_cost (float)
                        -- lines
                        -- nodes
                        -- passed (Boolean)
                    -- team_id
    '''
    new_scores_entry = {}
    new_scores_entry[submission_id] = {}
    new_scores_entry[submission_id]['evals'] = new_scores
    new_scores_entry[submission_id]['team_id'] = team_id

    score = SCORES.child(challenge_id)
    if score:
        SCORES.child(challenge_id).update(new_scores_entry)
    else:
        SCORES.child(challenge_id).set(new_scores_entry)

def get_leaderboard(challenge_id):
    # Leaderboard functions to display top 3 teams in different categories.
    challenge_ref = SCORES.child(str(challenge_id))
    result, passed_teams = {}, {}
    passed_teams = challenge_ref.order_by_child('evals/passed').equal_to(True).get()
    passed_scores = {}
    # get 'scores_best' for every passed team
    for team in passed_teams.values():
        team_id = team['team_id']
        passed_scores[team_id] = team['evals']
        if result == {}:
            for cat in passed_scores[team_id]:
                if cat == 'lines' or cat == 'nodes' or cat == 'passed':
                    continue
                result[cat] = OrderedDict()

    # get top 3 for each category by sorting the values
    for cat in result:
        if cat == 'lines' or cat == 'nodes' or cat == 'passed':
            continue
        # All current categories are the lower the better.
        top_teams = sorted(passed_scores, key=lambda x: passed_scores[x][cat])
        if len(top_teams) > 10:
            top_teams = top_teams[:10]
        # convert ids into names and put them into result.
        for team_id in top_teams:
            team = TEAMS.order_by_child('team_id').equal_to(int(team_id)).get()
            team_name = list(team.values())[0]['team_name']
            result[cat][team_name] = passed_scores[team_id][cat]
    
    return result

def delete_users():
    '''
    Delete 1000 users at a time to clear authentication db. Use with caution.
    '''
    # user = auth.get_user('0bg5BGvKcrOoFxANumiDhZ4O6ey2')
    page = auth.list_users()
    while page:
        for user in page.users:
            auth.delete_user(user.uid)
        # Get next batch of users.
        page = page.get_next_page()

# Endpoints of database related frontend call.
def register_routes(current_app):
    
    @current_app.route('/api/leaderboard/<int:challenge_id>', methods=['GET'])
    def show_leaderboard(challenge_id):
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
        leaderboard = get_leaderboard(challenge_id)
        return make_response(json.dumps(leaderboard))

    '''
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


# if __name__ == "__main__":
    # init_db_teams()
    # print(get_team_id("yourteam"))
    # insert_submission_entry({0: {}, 1: {"H": 1}, 2: {"N": 1},
    #                         3: {"H": 1, "N": 1, "R": 1}},
    #                         1, new_sys_info = {
    #                            'new_sub_datetime': '2018-03-16 18:20:18',
    #                            'new_num_attempts': 1,
    #                            'challenge_id': '10'})

    # insert_scores_entry(10, 1, team_id=3,
    #    new_scores={"cost": 6120.23, 
    #                 "passed": True, 
    #                 "CO2": 10000.41, 
    #                 "installation_cost": 523081,
    #                 "lines": {0: {'from': 0}},
    #                 "nodes": {0: {'node':0}}})
    # print(get_leaderboard('10'))
    # print(get_saved_challenge('10', '1'))
    # print(get_saved_challenge('10', '3'))
    # delete_users()
