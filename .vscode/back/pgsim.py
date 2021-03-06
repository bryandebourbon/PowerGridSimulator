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

import ppc_utils, db_utils, eval_pg, ppc_ontario_data, ppc_northern_ontario_data

from datetime import datetime, timedelta
import pprint

from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A
import ast, json
import numpy as np
import cProfile, pstats, io

pgsim_app = Flask(__name__) # create the application instance :)
pgsim_app.config.from_object(__name__) # load config from this file , flaskr.py


def create_app():
    return pgsim_app
    
# apply CORS to our pgsim app
CORS(pgsim_app)

# Load default config and override config from an environment variable
# TODO: can define env var FLASKR_SETTINGS that points to a config file to be loaded
pgsim_app.config.update(dict(
    SECRET_KEY='development key', # to keep the client-side sessions secure
    USERNAME='admin',
    PASSWORD='default'
    ))
pgsim_app.config.from_envvar('FLASKR_SETTINGS', silent=True)
# Note: need to set envvar in run.js: export FLASK_APP="pgsim.pgsim:create_app()", export FLASK_DEBUG=true

db_utils.register_routes(pgsim_app)

MAX_SUBMISSION_ATTEMPTS = 10

challenges = {
    10 : {"name": "Ontario Power Generation",
          "description": "Design Ontario's generation system to satisfy the power demand of all of " \
                        "Ontario! You will have maximum freedom with this challenge: you will have ten " \
                        "electricity zones to work with, ten transmission lines connecting between some " \
                        "of them for you to use, and many generators for you to play with. The zonal " \
                        "demand data is taken from IESO's 2017 zonal demand reports; the generation " \
                        "profiles and transmission line capacities are modelled after Ontario's existing " \
                        "generation and transmission system. The simulation outputs will contain " \
                        "information about the generator outputs, the total unit generation cost, the " \
                        "total generator installation cost, and more!",
          "data_module": ppc_ontario_data},
    11 : {"name": "Northern Ontario Power Generation",
          "description": "Design Northern Ontario's generation system to satisfy the power demand of " \
                        "Northern Ontario! This challenge is a good place to start if you are new: you " \
                        "will have two electricity zones to work with, a transmission line connecting " \
                        "between them for you to use, and a limited number of generators for you to play " \
                        "with. The zonal demand data is taken from IESO's 2017 zonal demand reports; " \
                        "the generation profiles and transmission line capacities are modelled after " \
                        "Ontario's existing generation and transmission system. The simulation outputs " \
                        "will contain information about the generator outputs, the total unit generation " \
                        "cost, the total generator installation cost, and more!",
          "data_module": ppc_northern_ontario_data},
}

@pgsim_app.route('/api/getChallenge/', methods=["GET"])
def get_challenge_list():
    """
    Returns a list of challenges of the following format:
    [{
        id: 1, name: name, description: description1, saved: false
     }, {
        id: 2, name: name2, description: description2, saved: true
    }]
    """
    result = []
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    for challenge_id in challenges:
        challenge = {}
        challenge['id'] = challenge_id
        challenge['name'] = challenges[challenge_id]['name']
        challenge['description'] = challenges[challenge_id]['description']
        saved_flag = False
        saved_challenge = db_utils.get_saved_challenge(challenge_id, team_id)
        if saved_challenge['submission_info']:
            saved_flag = True
        challenge['saved_flag'] = saved_flag

        result.append(challenge)
    return make_response(json.dumps(result))

@pgsim_app.route("/api/getChallenge/<int:challenge_id>", methods=["GET"])
def get_challenge(challenge_id):
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
    if challenge_id not in challenges:
        return make_response("The requested challenge doesn't exist.")

    pr = cProfile.Profile()
    pr.enable()

    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    saved_challenge = db_utils.get_saved_challenge(challenge_id, team_id)

    data_module = challenges[challenge_id]["data_module"]

    gens = []
    for gen_type, gen_params in data_module.gen_types.items():
        cur_gen = {"type": gen_type}
        for param_name, param in gen_params.items(): 
            if isinstance(param, np.ndarray):   cur_gen[param_name] = param.tolist()
            else:                               cur_gen[param_name] = param
        gens.append(cur_gen)

    demands = [{"node": node, 
                "real": data_module.real_demand_profiles[:,node].tolist(), 
                "reactive": data_module.reactive_demand_profiles[:,node].tolist()} 
                for node in range(data_module.real_demand_profiles.shape[1])]

    lines = [{"from": int(line[F_BUS]) - 1, "to": int(line[T_BUS]) - 1, "capacity": float(line[RATE_A])} 
                for line in data_module.transmission_limits]

    challenge = make_response(json.dumps(
        {"id": int(challenge_id),
         "name": challenges[int(challenge_id)]["name"],
         "description": challenges[int(challenge_id)]["description"],
         "saved_challenge": saved_challenge['submission_info'],
         "generators": gens,
         "demands": demands,
         "lines": lines}))

    pr.disable()
    s = io.StringIO()
    sortby = 'cumulative'
    ps = pstats.Stats(pr, stream=s)
    if ps.total_tt > 1.0:
        ps.sort_stats(sortby).print_stats(20)
        print(s.getvalue(), file=open(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "get_challenge_profile.txt"), 
            "a"))

    return challenge

# Submit and evaluate submitted form data.
@pgsim_app.route("/api/submit/", methods=["POST"])
def submit():
    # Input: A json-wrapped list of dictionaries, each dict for each node in 
    # order; each dict says how many generators of each type that this node has. 
    # For example, for a 4+ node system, this could look like:
    #     [{'node': 0, 'generators': {} },
    #      {'node': 1, 'generators': {'H': 1}},
    #      {'node': 2, 'generators': {"N": 1}},
    #      {'node': 3, 'generators': {'H': 1, "N": 1, "R": 1}} ]
    # Output: A json-wrapped dictionary

    # Get the team and challenge ID.
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    challenge_id = request.headers["challenge_id"]
    if int(challenge_id) not in challenges:
        return make_response(json.dumps({
            'success': False, 
            'message': "This challenge doesn't exist."}))

    # Convert the json data into a dictionary 
    submitted_data = request.get_data().decode('unicode_escape')
    submitted_data = json.loads(submitted_data)

    # Convert the dict structure of the input design into a structure used in
    # backend. Assuming there are n nodes, such a structure is a list of n 
    # dicts. Dict #i is the generator dict of node #i (e.g. {'H': 1, "N": 1}).
    max_node_idx = -1
    for submitted_node in submitted_data:
        node_idx = int(submitted_node["node"])
        if node_idx > max_node_idx: max_node_idx = node_idx
    gen_placements = [{} for i in range(max_node_idx + 1)]
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
            'message': 'Please make use of at least one dispatchable generator (i.e. hydro or gas generator).'}))

    # Evaluate the submitted design.
    status = do_submit_routine(gen_placements, team_id, challenge_id)

    #pp = pprint.PrettyPrinter(indent=4)
    #pp.pprint(status)
    #print(json.dumps(status))

    return make_response(json.dumps(status))

def do_submit_routine(gen_placements, team_id, challenge_id):
    status = {'success': True, 'message': 'Processing...'}

    # Check if the team has waited long enough since the last submission.
    latest_submission_entry = db_utils.get_saved_challenge(challenge_id, team_id)
    sub_date_time = datetime.now()
    if not latest_submission_entry['submission_time']: 
        sub_wait_time = timedelta(days=10)
    else:
        sub_wait_time = sub_date_time - datetime.strptime(
            latest_submission_entry['submission_time'], "%Y-%m-%d %H:%M:%S")
    # TODO(Mel): Update the time limit to be longer before deployment.
    if timedelta(seconds=5) > sub_wait_time:
       status['success'] = False
       status['message'] = "Need to wait {} until submit.".format(str(timedelta(seconds=5) - sub_wait_time))
       return status
    
    # Check if the team still has enough allowed attempts left.
    sub_index = latest_submission_entry['num_attempt'] # Should start off at 0
    if sub_index >= MAX_SUBMISSION_ATTEMPTS:
       status['success'] = False
       status['message'] = "Max submission attempts reached."
       return status

    # Store the submitted design into the database.
    new_sys_info = {
       'new_sub_datetime': sub_date_time.strftime("%Y-%m-%d %H:%M:%S"),
       'new_num_attempts': sub_index + 1,
       'challenge_id': challenge_id
    }
    submission_id = db_utils.insert_submission_entry(gen_placements, team_id, new_sys_info)
    if submission_id < 0:
       status['success'] = False
       status['message'] = "Could not insert submission to database."
       return status
    
    # Pass the design into PyPower and other evaluation metric to calculate 
    # generations, transmissions, cost, CO2 emissions, etc. 
    data_module = challenges[int(challenge_id)]["data_module"]
    new_scores = eval_pg.calc_score(gen_placements, data_module)

    # Update the stored metrics of this team.
    db_utils.insert_scores_entry(challenge_id, submission_id, team_id, new_scores)

    status['message'] = "{} Submission #{} successful.".format(sub_date_time.strftime("%Y-%m-%d %H:%M:%S"), sub_index)
    status['eval'] = new_scores
    return status
