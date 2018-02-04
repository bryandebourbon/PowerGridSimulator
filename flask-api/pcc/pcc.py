# API file for PCC web system.


import os

from flask import Flask, make_response, request, current_app, g, render_template
import json
from flask_cors import CORS

import pprint # Pretty print for data structures in terminal.

pcc_app = Flask(__name__)

pcc_app.config.from_object(__name__) # load config from this file, pcc.py

# Load default config and override config from an environment variable
pcc_app.config.update(dict(
    DATABASE=os.path.join(pcc_app.root_path, 'pcc.db'), #,
    SECRET_KEY='devkey',
    USERNAME='admin',
    PASSWORD='pass'
))
pcc_app.config.from_envvar('FLASKR_SETTINGS', silent=True)


# PCC web system dependencies by component.

import auth, dbfunc, evalu, prep, store
import pcc_test # Prefer not to import test (circular import). TODO: find alternative way of testing.

CORS(pcc_app)

NUM_SAMPLE_TEAMS = 20
NUM_SAMPLE_SUBMISSIONS = 53
SCHEMA = './schema.sql'
MAX_SUBMISSION_ATTEMPTS = 5
#REQUIRED_NUM_TIMESTEPS = 24 # To check 24 columns are given in csv form

ADMIN_COMMANDS = [
    'init_empty_db',
    'popu_db_sample_teamsonly',
    'popu_db_sample_all',
    'auth_one_team_static',
    'add_one_sub_static',
    'print_db',
    'update_scores'
]


# Title for admin commands, for interface use (not in code)

ADMIN_COMMANDS_TITLE = [
    'Initialize empty database'
]


# Update scores, given submissions and teams in db.

def update_scores():
    team_ids = prep.get_all_team_ids_score()

    for i in range(len(team_ids)):

        best_submit_id, num_attempts = prep.get_best_overall_submit_id(team_ids[i])

        submit_info = prep.get_submission_entry(best_submit_id)

        score_entry = prep.make_scores_entry(submit_info)
        score_entry['num_attempts'] = num_attempts # probably have a helper function like reassign_attempts for this

        store.update_scores_entry(score_entry)


# Sample db prepare and store routine.
def give_db_sample_data():
    num_sample_teams = NUM_SAMPLE_TEAMS
    num_sample_submissions = NUM_SAMPLE_SUBMISSIONS
    team_sample_data = prep.generate_team_sample_data(num_sample_teams)
    submission_sample_data = prep.generate_submission_sample_data(num_sample_submissions, num_sample_teams)

    # For now, scores remains as zeroes (not actually corresponding to the sample submissions
    # as best scores have not been tracked for each team - they are zero).
    scores_sample_data = prep.generate_scores_zeroes(num_sample_teams)

    store.populate_db(team_sample_data, submission_sample_data, scores_sample_data)


# Initialize db sample for testing queries.

@pcc_app.cli.command('init_db_sample')
def init_db_sample_cmd():

    dbfunc.init_db(SCHEMA, pcc_app)

    give_db_sample_data()

    print('Initialized and filled sample database with sample data.')


# Initialize db empty for testing insertion and querying.

@pcc_app.cli.command('init_db_empty')
def init_db_empty_cmd():

    dbfunc.init_db(SCHEMA, pcc_app)

    print('Initialized empty db.')

# Close db connection when app closes.

@pcc_app.teardown_appcontext
def close_db_connection(exception):

    db = getattr(g, '_database', None)

    # If the application context g has the _database attribute, close the database
    # connection.
    if db is not None:
        db.close()


# Welcome message for homepage.

@pcc_app.route("/")
def welcome():
    return json.dumps("This is the Power Case Competition API which React calls.")


# Do submit routine. Data should be in a "nice" form by the time it reaches
# here, i.e. data is packaged in a way that it can be added right away to the
# ppc case.
# TODO: error codes.

def do_submit_routine(matrix, team_name, team_key):

    # This is what a "nice" submission should look like when it enters.
    # Dimensions: #timesteps (across) x #nodes (below)
    # matrix = None
    # matrix = [
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3],
    #     [3,3,3,3,3,3]
    # ]

    if matrix is None:
        return make_response("Submission input error.")

    print("Aggregate generator profile at each node:")
    print(type(matrix))
    print(type(matrix[0]))
    print(type(matrix[0][0]))
    print(matrix)

    ppc_timesteps = prep.make_ppc_timesteps(matrix)

    if ppc_timesteps is None:
        return make_response("Calculation error.")

    # Scorecard is the endpoint for React (for now). If submission successful, this is
    # sent up.
    scorecard = evalu.score_sub(ppc_timesteps)

    user_data_found_db = prep.get_team_auth_data()
    team_id = auth.get_matching_team_id(team_name, team_key, user_data_found_db)

    if team_id is None:
        return make_response("Authentication error.")

    # Store matrix not data_submitted since want to store clean data.
    new_submission_entry = prep.make_submission_entry(team_id, matrix, scorecard)

    score_success = current_best_score_sub = prep.get_score(team_id)

    if score_success is None:
        return make_response("Score query error.")

    if current_best_score_sub['num_attempts'] == 0:
        # No current best score yet (i.e. first submission)

        sub_success = store.insert_submission_entry(new_submission_entry)

        new_scores_entry = prep.make_scores_entry(new_submission_entry)
        score_success = store.update_scores_entry(new_scores_entry)

    elif current_best_score_sub['num_attempts'] < MAX_SUBMISSION_ATTEMPTS:

        sub_success = store.insert_submission_entry(new_submission_entry)

        if sub_success is None:
            return make_response("Submission storage error.")

        new_beats_current = evalu.is_better_score(new_submission_entry, current_best_score_sub)

        if new_beats_current:

            new_scores_entry = prep.make_scores_entry(new_submission_entry)
            score_success = store.update_scores_entry(new_scores_entry)
        else:

            score_success = store.increment_score_attempt(current_best_score_sub['team_id'], prep.get_score(current_best_score_sub['team_id'])['num_attempts'])

    else:
        print("Submission attempts maxed.")

    if score_success is None:
        return make_response("Score update error.")

    # return 1
    return scorecard # Success


# Submit and evaluate submitted form data.

@pcc_app.route("/submit/", methods=["POST"])
def submit():

    # NOTE: Get the data from the request is commented out for now. Here is where
    # the submitted_info will be taken from the request, cleaned up, and sent
    # in place of where submitted_info is into the do_submit_routine.

    # TODO: get the data from the request, and clean up so it is in the format
    # of the submitted_info.

    #data_submitted = request.get_data().decode('unicode_escape')
    #matrix = prep.clean_submission(json.loads(data_submitted))

    # TODO: get the team credentials from the request (or header)
    team_name = "Team Name 91" #request.headers["username"]
    team_key = "kEy61" #request.headers["key"]

    # Assumes the submitted data from client side can be processed to look
    # like this.
    # Possible generators: 'H' (hydro), 'N' (nuclear), 'R' (renewable), 'Z' (zero, nothing given).
    # List indices correspond to node numbers.
    submitted_info = [
        ['H', 'N', 'R'],
        ['Z'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['Z'],
        ['H', 'N', 'R'],
        ['Z'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R'],
        ['H', 'N', 'R']
    ]

    status = do_submit_routine(prep.matrix_from_submit_info(submitted_info), team_name, team_key)

    pp = pprint.PrettyPrinter(indent=4)
    pp.pprint(status)

    # if (status != 1):
    #     return status

    # Successful - here, the "state" (of the submission result web page) gets
    # sent back (showing scores, feedback info, team status (i.e. attempts))
    return make_response(json.dumps(status))


# Login and auhentication process for user.

@pcc_app.route("/login/")
def login():

    username = request.headers["username"]
    key = request.headers["key"]

    user_data_found_db = prep.get_team_auth_data()
    return auth.check_user(username, key, user_data_found_db)


# Leaderboard of scores for React to display.

@pcc_app.route("/leaderboard/")
def leaderboard():

    leaderboard = prep.make_leaderboard()

    return make_response(leaderboard)


# Test the connection to the API.

@pcc_app.route("/test/")
def test():

    res = make_response("Connection")
    return res


# Parser for running admin commands.
# Python CLI may also be used to run these commands.
# Some may initially be written as testing functions, later move.

def admin_run_cmd(command=None):

    if command is None:
        return None

    if (command == ADMIN_COMMANDS[0]):
        dbfunc.init_db(SCHEMA, pcc_app)
        return 'Initialized empty db.'

    elif (command == ADMIN_COMMANDS[1]):
        num_sample_teams = NUM_SAMPLE_TEAMS

        team_sample_data = prep.generate_team_sample_data(num_sample_teams)
        submission_sample_data = []
        scores_sample_data = prep.generate_scores_zeroes(num_sample_teams)

        store.populate_db(team_sample_data, submission_sample_data, scores_sample_data)

        return 'Populated db with sample teams, and empty submissions and zero-scores.'

    elif (command == ADMIN_COMMANDS[2]):
        # TODO: Check db exists and recommend appropriate command.

        give_db_sample_data()

        return 'Populated db with sample team, submission, and zero-scores.'

    elif (command == ADMIN_COMMANDS[3]):

        team_name = "Team Name 91" #request.headers["username"]
        team_key = "kEy61" #request.headers["key"]

        user_data_found_db = prep.get_team_auth_data()

        result = auth.check_user(team_name, team_key, user_data_found_db)

        return ('Authenticated a team from db. Result: \"' + result + '\"')

    elif (command == ADMIN_COMMANDS[4]):

        # num_timesteps = 24
        # num_generators = 14
        # gen_val = 3

        # Assumes the submitted data from client side can be processed to look
        # like this.
        # Possible generators: 'H' (hydro), 'N' (nuclear), 'R' (renewable), 'Z' (zero, nothing given).
        # List indices correspond to node numbers.
        submitted_info = [
            ['H', 'N', 'R'],
            ['Z'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['Z'],
            ['H', 'N', 'R'],
            ['Z'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R'],
            ['H', 'N', 'R']
        ]

        proper_sub_matrix = prep.matrix_from_submit_info(submitted_info)

        # old_sub_matrix = prep.make_sub_matrix_static_case(num_timesteps, num_generators, gen_val)

        # TODO: use whichever team was authenticated with in the admin console (if any).
        team_name = "Team Name 91" #request.headers["username"]
        team_key = "kEy61" #request.headers["key"]

        do_submit_routine(proper_sub_matrix, team_name, team_key)

        return "Added one static sample submission case to db."

    elif (command == ADMIN_COMMANDS[5]):

        dbfunc.print_entire_db()

        return "Printed db."

    elif (command == ADMIN_COMMANDS[6]):

        update_scores()

        return "Completely updated scores table in db."

    return 'Invalid admin command.'


# Admin console for admin functions and testing.

@pcc_app.route('/admin/')
@pcc_app.route('/admin/<command>/')
def admin(command=None):

    user = "admin"
    password = "pass"
    key = "devkey"

    if (user != pcc_app.config['USERNAME']):
        return make_response("Incorrect username.")
    if (password != pcc_app.config['PASSWORD']):
        return make_response("Incorrect password.")

    output = admin_run_cmd(command)

    return render_template('admin.html', COMMANDS=ADMIN_COMMANDS, output=output)


if __name__ == "__main__":
    pcc_app.run()
