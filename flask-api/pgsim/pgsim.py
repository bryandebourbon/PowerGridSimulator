# This is the main entry point to run the flask server.
# Contains all the code for setting up the server.  
#
# For reference: Flask setup code from http://flask.pocoo.org/docs/0.12/tutorial

import os
import sqlite3
from werkzeug.utils import find_modules, import_string
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash, make_response

# this fixes the CORS issue, apparently flask has a library for that
from flask_cors import CORS 

import pgsim.ppc_utils as ppc_utils, pgsim.db_utils as db_utils, pgsim.eval_pg as eval_pg
# import  ppc_utils, db_utils, eval_pg

from datetime import datetime, timedelta
import pprint

from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A
import ast, json
import numpy as np
import cProfile, pstats, io

pgsim_app = Flask(__name__) # create the application instance :)
pgsim_app.config.from_object(__name__) # load config from this file , flaskr.py

# apply CORS to our pgsim app
CORS(pgsim_app)

# Load default config and override config from an environment variable
# TODO: can define env var FLASKR_SETTINGS that points to a config file to be loaded
pgsim_app.config.update(dict(
    DATABASE=os.path.join(pgsim_app.root_path, 'flaskr.db'), # TODO: is this needed??
    SECRET_KEY='development key', # to keep the client-side sessions secure
    USERNAME='admin',
    PASSWORD='default'
    ))
pgsim_app.config.from_envvar('FLASKR_SETTINGS', silent=True)
# Note: need to set envvar in run.js: export FLASK_APP="pgsim.pgsim:create_app()", export FLASK_DEBUG=true

db_utils.register_routes(pgsim_app)

MAX_SUBMISSION_ATTEMPTS = 10

@pgsim_app.route("/getChallenge/", methods=["GET"])
def get_challenge():
    # return a dictionary with the following entries: “generators”, “demands”, “lines”
    # - “generators”: a list of dicts, one dict for each generator type
    # [{ “type”: generator type, can be: “N”, “H”, “G”, “W”, “S”, 
    #    “count”: count of how many of these are available to students,      
    #    “real_capacity”: generation capacity over a time series represented in a list,
    #    “reactive_capacity”: reactive power capacity, same format as real_capacity,
    #    “per_node_limit”: an array of dimension (number of nodes x 2), first column 
    #                     is index (0-based), second column is max number of this type of generators at this node },
    #   { more generator type... }, { ... }]
    # - “demands”:
    #    [{ “node”: 0-based index
    #     “real”: a list, length = number of timesteps
    #     “reactive”: same dimension}, 
    #   { more nodes ... }, {}]
    # - “lines”: a list of dicts, one dict for each line
    #         [{ “from”: from node, 0-based
    #    “to”: destination node, also 0-based
    #    “capacity”: one number, constant capacity
    #    This is up for change, might add more parameters},
    #   { some other line...}, { ... }]
    pr = cProfile.Profile()
    pr.enable()

    print(request.headers)

    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    challenge_id = request.headers["challenge_id"]
    saved_challenge = db_utils.get_saved_challenge(challenge_id, team_id)

    gens = []
    for gen_type, gen_params in ppc_utils.gen_types.items():
        cur_gen = {"type": gen_type}
        for param_name, param in gen_params.items(): 
            if isinstance(param, np.ndarray):   cur_gen[param_name] = param.tolist()
            else:                               cur_gen[param_name] = param
        gens.append(cur_gen)

    demands = [{"node": node, 
                "real": ppc_utils.real_demand_profiles[:,node].tolist(), 
                "reactive": ppc_utils.reactive_demand_profiles[:,node].tolist()} 
                for node in range(ppc_utils.real_demand_profiles.shape[1])]

    lines = [{"from": int(line[F_BUS]), "to": int(line[T_BUS]), "capacity": float(line[RATE_A])} 
                for line in ppc_utils.transmission_limits]

    challenge = make_response(json.dumps(
        {"id": 1,
         "name": "Ontario Power Generation",
         "description": "Design Ontario's generation system with real-life demand, generation cost, CO2 emission, and more data! (Description proposed by mighty Jane)",
         "saved_challenge": saved_challenge,
         "generators": gens,
         "demands": demands,
         "lines": lines}))

    pr.disable()
    s = io.StringIO()
    sortby = 'cumulative'
    ps = pstats.Stats(pr, stream=s).sort_stats(sortby)
    ps.print_stats()
    print(s.getvalue(), file=open(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "get_challenge_profile.txt"), 
        "a"))

    return challenge

# Submit and evaluate submitted form data.
@pgsim_app.route("/submit/", methods=["POST"])
def submit():
    # Input: A json-wrapped list of dictionaries, each dict for each node in 
    # order; each dict says how many generators of each type that this node has. 
    # For example, for a 4+ node system, this could look like:
    #     [{'node': 0, 'generators': {} },
    #      {'node': 1, 'generators': {'H': 1}},
    #      {'node': 2, 'generators': {"N": 1}},
    #      {'node': 3, 'generators': {'H': 1, "N": 1, "R": 1}} ]
    # Output: A json-wrapped dictionary

    # Convert the json data into a dictionary 
    submitted_data = request.get_data().decode('unicode_escape')
    submitted_data = json.loads(submitted_data)

    # Convert the dict structure of the input design into a structure used in
    # backend. Assuming there are n nodes, such a structure is a list of n 
    # dicts. Dict #i is the generator dict of node #i (e.g. {'H': 1, "N": 1}).
    gen_placements = [{} for i in range(ppc_utils.node_count)]
    no_gens = True
    for submitted_node in submitted_data:
        gen_placements[int(submitted_node["node"])] = submitted_node["generators"]
        if "generators" in submitted_node and \
            (submitted_node["generators"].get("H", 0) > 0 or 
                submitted_node["generators"].get("G", 0) > 0): 
            no_gens = False
    if no_gens: 
        return make_response(json.dumps({
            'success': False, 
            'message': 'Please specify at least one hydro or gas generator for PyPower to process successfully.'}))

    # Get the team and challenge ID.
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    challenge_id = request.headers["challenge_id"]

    # Evaluate the submitted design.
    status = do_submit_routine(gen_placements, team_id, challenge_id)

    #pp = pprint.PrettyPrinter(indent=4)
    #pp.pprint(status)
    #print(json.dumps(status))

    return make_response(json.dumps(status))

def do_submit_routine(gen_placements, team_id, challenge_id):
    status = {'success': True, 'message': 'Processing...'}

    # Check if the team has waited long enough since the last submission.
    # TODO(Mel): Get the latest?(you mean current?) scores status.
    latest_scores_status_entry = db_utils.get_scores_status_entry(team_id)
    sub_date_time = datetime.now()
    if not latest_scores_status_entry['last_submit_success_time']: 
        sub_wait_time = timedelta(days=10)
    else:
        sub_wait_time = sub_date_time - datetime.strptime(
            latest_scores_status_entry['last_submit_success_time'], "%Y-%m-%d %H:%M:%S")
    # TODO(Mel): Update the time limit to be longer before deployment.
    if timedelta(seconds=5) > sub_wait_time:
       status['success'] = False
       status['message'] = "Need to wait {} until submit.".format(str(timedelta(seconds=5) - sub_wait_time))
       return status
    
    # Check if the team still has enough allowed attempts left.
    sub_index = latest_scores_status_entry['num_attempts'] # Should start off at 0
    if sub_index >= MAX_SUBMISSION_ATTEMPTS:
       status['success'] = False
       status['message'] = "Max submission attempts reached."
       return status

    # Store the submitted design into the database.
    submission_id = db_utils.insert_submission_entry(gen_placements, team_id, challenge_id)
    if submission_id < 0:
       status['success'] = False
       status['message'] = "Could not insert submission to database."
       return status
    
    # Pass the design into PyPower and other evaluation metric to calculate 
    # generations, transmissions, cost, CO2 emissions, etc. 
    new_scores = eval_pg.calc_score(gen_placements)

    # Update the stored metrics of this team.
    new_sys_info = {
       'new_sub_datetime': sub_date_time.strftime("%Y-%m-%d %H:%M:%S"),
       'new_num_attempts': sub_index + 1,
       'challenge_id': challenge_id
    }
    if sub_index == 0:
        db_utils.update_scores_entry(submission_id, new_sys_info, team_id, new_scores)
    else:
        # get best scores
        best_scores = db_utils.get_best_scores(latest_scores_status_entry['scores_best'], new_scores)
        db_utils.update_scores_entry(submission_id, new_sys_info, team_id, best_scores)

    status['message'] = "{} Submission #{} successful.".format(sub_date_time.strftime("%Y-%m-%d %H:%M:%S"), sub_index)
    status['eval'] = new_scores
    return status
