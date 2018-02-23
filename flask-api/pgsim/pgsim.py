# This is the main entry point to run the flask server.
# Contains all the code for setting up the server.  
#
# For reference: Flask setup code from http://flask.pocoo.org/docs/0.12/tutorial

import os
import sqlite3
from werkzeug.utils import find_modules, import_string
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash, make_response
# from flask_cors import CORS ?
# CORS(pgsim_app)

import db_utils
import ppc_utils
import eval_pg
from datetime import datetime, timedelta
import pprint

from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A
import ast, json
import numpy as np

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

    return make_response(json.dumps({"generators": gens, "demands": demands, "lines": lines}))

# Submit and evaluate submitted form data.
@pgsim_app.route("/submit/", methods=["POST"])
def submit():
    # Input: a list of dictionaries, each dict for each node in order; each dict
    # says how many generators of each type that this node has. For example, for
    # a 4-node system, this could look be:
    #     [  {“node”: 0, “generators”: {} },
    #           {“node”: 1, “generators”: {'H': 1}},
    #               {“node”: 2, “generators”: {"N": 1}},
    #           {'“node”: 3, “generators”: {‘H': 1, "N": 1, "R": 1}} ]
    # Output: A dictionary

    submitted_data = request.get_data().decode('unicode_escape')
    submitted_data = json.loads(submitted_data)
    assert (len(submitted_data) == ppc_utils.node_count), "The submitted data must contain correct number of nodes"
    
    # Convert the dict structure into a structure used in backend.
    gen_placements = [{} for i in range(ppc_utils.node_count)]
    for submitted_node in submitted_data:
        gen_placements[int(submitted_node["node"])] = submitted_node["generators"]

    team_name = str(request.headers["username"])
    status = do_submit_routine(gen_placements, team_name)

    #pp = pprint.PrettyPrinter(indent=4)
    #pp.pprint(status)
    #print(json.dumps(status))

    return make_response(json.dumps(status))

def do_submit_routine(gen_placements, team_name):
    status = { # To return to React
        'success': True,
        'message': "Processing",
    }
    sub_index = 0

    # TODO(Mel): Get the latest scores status.
    #latest_scores_status_entry = db_utils.get_scores_status_entry(team_name)
    sub_date_time = datetime.now()
    #sub_wait_time = sub_date_time - datetime.strptime(latest_scores_status_entry['last_submit_success_time'], "%Y-%m-%d %H:%M:%S")
    #
    # Check if the team is allowed to submit. 
    #if timedelta(seconds=5) > sub_wait_time:
    #    status['success] = False
    #    status['message'] = "Need to wait {} until submit.".format(str(timedelta(seconds=5) - sub_wait_time))
    #    return status
    #
    #sub_index = latest_scores_status_entry['num_attempts'] # Should start off at 0
    #if sub_index >= MAX_SUBMISSION_ATTEMPTS:
    #    status['success'] = False
    #    status['message'] = "Max submission attempts reached."
    #    return status
    #sub_index += 1
    #new_sys_info = {
    #    'new_sub_datetime': sub_date_time.strftime("%Y-%m-%d %H:%M:%S"),
    #    'new_num_attempts': sub_index
    #}

    # TODO(Mel): Update the database with the new score (i.e. eval result) and submission logistics data.

    status['eval'] = eval_pg.calc_score(gen_placements)
    status['message'] = "{} Submission #{} successful.".format(sub_date_time.strftime("%Y-%m-%d %H:%M:%S"), sub_index)
    return status


