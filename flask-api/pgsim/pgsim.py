# This is the main entry point to run the flask server.
# Contains all the code for setting up the server.  
#
# For reference: Flask setup code from http://flask.pocoo.org/docs/0.12/tutorial

import os
import sqlite3
from werkzeug.utils import find_modules, import_string
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash
# from flask_cors import CORS ?
# CORS(pgsim_app)

import db_utils
import ppc_utils
import eval_pg
from datetime import datetime, timedelta
import pprint

pgsim_app = Flask(__name__) # create the application instance :)
pgsim_app.config.from_object(__name__) # load config from this file , flaskr.py

# Load default config and override config from an environment variable
# TODO: can define env var FLASKR_SETTINGS that points to a config file to be loaded
pgsim_app.config.update(dict(
    DATABASE=os.path.join(pgsim_app.root_path, 'flaskr.db'),
    SECRET_KEY='development key', # to keep the client-side sessions secure
    USERNAME='admin',
    PASSWORD='default'
    ))
pgsim_app.config.from_envvar('FLASKR_SETTINGS', silent=True)
# Note: need to set envvar in run.js: export FLASK_APP="pgsim.pgsim:create_app()", export FLASK_DEBUG=true

db_utils.register_cli(pgsim_app)
db_utils.register_teardowns(pgsim_app)
db_utils.register_routes(pgsim_app)

# Submit and evaluate submitted form data.
@pgsim_app.route("/submit/", methods=["POST"])
def submit():
    # TODO: Decide on the output format of the front-end, and update the logic
    # here for reading in the design.
    submitted_data = request.get_data().decode('unicode_escape')
    submitted_data = json.loads(submitted_data)
    assert (len(submitted_data) == pgsim.pcc_utils.node_count), "The submitted data must contain correct number of nodes"
    
    gen_placements = []
    for submitted_node in submitted_data:
        gen_placement = {}
        for gen in submitted_node: # Nuclear, Solar, Hydro, Wind, etc. 
            gen = gen[0] # Take the first letter: Nuclear - N, Solar - S, Hydro - H, Wind - W
            gen_placement[gen] = gen_placement.get(gen, 0) + 1
        gen_placements.append(gen_placement)
    #print(submitted_info)

    # TODO: Have the front-end relay the team id back to us?
    team_name = str(request.headers["username"])
    team_key = str(request.headers["key"])
    status = do_submit_routine(gen_placements, team_name, team_key)

    #pp = pprint.PrettyPrinter(indent=4)
    #pp.pprint(status)
    print(json.dumps(status))

    return make_response(json.dumps(status))

def do_submit_routine(gen_placements, team_name, team_key):
    sub_status = { # To return to React
        'error': None,
        'message': None,
        'status': None,
        'scorecard': None
    }

    current_scores_status_entry = db_utils.get_scores_status_entry(team_id)
    #sub_date_time = datetime.now()
    #sub_wait_time = sub_date_time - datetime.strptime(current_scores_status_entry['last_submit_success_time'], "%Y-%m-%d %H:%M:%S")
    #
    ## TODO: Change to an approripate time later (e.g. 20 mins).
    #if timedelta(seconds=5) > sub_wait_time:
    #    sub_status['error'] = 2
    #    sub_status['message'] = "Need to wait {} until submit.".format(str(timedelta(seconds=5) - sub_wait_time))
    #    return sub_status
    #
    #if current_scores_status_entry['num_attempts'] >= MAX_SUBMISSION_ATTEMPTS:
    #    sub_status['error'] = 3
    #    sub_status['message'] = "Max submission attempts reached."
    #    sub_status['status'] = new_sys_info
    #    return sub_status

    eval_result = eval_pg.calc_score(gen_placements)

    new_sys_info = {
        'new_sub_datetime': sub_date_time.strftime("%Y-%m-%d %H:%M:%S"),
        'new_num_attempts': current_scores_status_entry['num_attempts'] + 1
    }

    # TODO: Update the database with the new score (i.e. eval_result) and submission logistics data.

    sub_status['error'] = 0
    sub_status['message'] = "Submission successful."
    sub_status['status'] = new_sys_info
    sub_status['result'] = eval_result

    return sub_status

