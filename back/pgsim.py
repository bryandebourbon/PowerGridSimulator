"""This module contains the Flask server set-up code, and is the main entry
point to the flask server. It also contains the backend routing code for all
non database-related routes.

See [Flask tutorial](http://flask.pocoo.org/docs/0.12/tutorial) for reference.
"""

# ========== imports ========== #
import os, json, cProfile, pstats, io, numpy as np
from datetime import datetime, timedelta
# Flask imports
from werkzeug.utils import find_modules, import_string
from flask import Flask, request, session, g, redirect, url_for, abort, \
     render_template, flash, make_response
from flask_cors import CORS
# PyPower imports
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A
# Other modules
import ppc_utils, db_utils, eval_pg, ppc_ontario_data, ppc_northern_ontario_data

# ========== Flask set-up code ========== #
pgsim_app = Flask(__name__) # create the application instance :)
pgsim_app.config.from_object(__name__) # load config from this file , flaskr.py
CORS(pgsim_app) # apply CORS to our pgsim app
# Load default config and override config from an environment variable
pgsim_app.config.update(dict(
    SECRET_KEY='development key', # to keep the client-side sessions secure
    USERNAME='admin',
    PASSWORD='default'
    ))
pgsim_app.config.from_envvar('FLASKR_SETTINGS', silent=True)
def create_app():
    return pgsim_app

# ========== configurable constants ========== #
MAX_SUBMISSION_ATTEMPTS = 100
CHALLENGES = {
    # Key: challenge ID (int)
    # Value: name and description that will be displayed on the frontend;
    #        data module that contains the challenge's data
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


# ========== backend routes ========== #
db_utils.register_routes(pgsim_app)

@pgsim_app.route('/api/getChallenge/', methods=["GET"])
def get_challenge_list():
    """Returns a list of available challenges.
    Requires the request header to contain a "team_name" entry to check whether
    the challenges have saved designs already.

    Args:
        None.

    Returns:
        A list of challenges. Each challenge is represented with a dictionary,
        with entires "id" (int), "name" (str), "description" (str), and "saved_
        flag" (boolean).
    """

    result = []
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)

    for challenge_id in CHALLENGES:
        challenge = {}
        challenge['id'] = challenge_id
        challenge['name'] = CHALLENGES[challenge_id]['name']
        challenge['description'] = CHALLENGES[challenge_id]['description']
        challenge['saved_flag'] = \
            True if db_utils.get_saved_challenge(challenge_id, team_id)['submission_info'] \
            else False
        result.append(challenge)

    return make_response(json.dumps(result))

@pgsim_app.route("/api/getChallenge/<int:challenge_id>", methods=["GET"])
def get_challenge(challenge_id):
    """Return all information related to a challenge.
    Requires the request header to contain a "team_name" entry to retrieve the
    last saved design.

    Args:
        challenge_id (int): The ID of the requested challenge.

    Returns:
        An error message (str) if the requested challenge ID doesn't exist.
        Otherwise, return a dictionary with the following entries: "generators",
        "demands", "lines":
            - "generators": a list of dicts, one dict for each generator type:
                  { "type": generator type, can be “N”, “H”, “G”, “W”, or “S”;
                    "count": count of how many of these are available to install;
                    "real_capacity": generation capacity over a time series represented in a list;
                    "reactive_capacity": reactive generation power capacity over a time series represented in a list;
                    "per_node_limit": an array of dimension (number of nodes, 2), first column is the nodeindex
                                      (0-based), second column is the max number of this type of generators that can be
                                      installed at this node }
            - "demands": a list of dicts, one dict for each node:
                  { "node": index of the node (0-based)
                    "real": the node's power demand, it's a list of length equal to the number of timesteps
                    "reactive": the node's reactive power demand, same format as "real" }
            - "lines": a list of dicts, one dict for each transmission line:
                  { "from": index of the source node (0-based)
                    "to": index of the destination node (0-based)
                    "capacity": a constant long-term MVA rating }
    """
    if challenge_id not in CHALLENGES:
        return make_response("The requested challenge doesn't exist.")
    data_module = CHALLENGES[challenge_id]["data_module"]

    # Start profiling.
    pr = cProfile.Profile()
    pr.enable()

    # Retrieve the team name from the request header and last saved design from database.
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    saved_challenge = db_utils.get_saved_challenge(challenge_id, team_id)

    # Assemble the list of generator information.
    gens = []
    for gen_type, gen_params in data_module.gen_types.items():
        cur_gen = {"type": gen_type}
        for param_name, param in gen_params.items():
            cur_gen[param_name] = param.tolist() if isinstance(param, np.ndarray) else param
        gens.append(cur_gen)

    # Assemble the list of node demand data.
    demands = [{"node": node,
                "real": data_module.real_demand_profiles[:,node].tolist(),
                "reactive": data_module.reactive_demand_profiles[:,node].tolist()}
                for node in range(data_module.real_demand_profiles.shape[1])]

    # Assemble the list of line capacities.
    lines = [{"from": int(line[F_BUS]) - 1, "to": int(line[T_BUS]) - 1,
                    "capacity": float(line[RATE_A])}
                for line in data_module.transmission_limits]

    # End profiling and record irregular runtimes.
    pr.disable()
    s = io.StringIO()
    sortby = 'cumulative'
    ps = pstats.Stats(pr, stream=s)
    if ps.total_tt > 1.0:
        ps.sort_stats(sortby).print_stats(20)
        print(s.getvalue(), file=open(
            os.path.join(os.path.dirname(os.path.abspath(__file__)),
                "get_challenge_profile.txt"),
            "a"))

    return make_response(json.dumps(
        {"id": int(challenge_id),
         "name": CHALLENGES[int(challenge_id)]["name"],
         "description": CHALLENGES[int(challenge_id)]["description"],
         "saved_challenge": saved_challenge['submission_info'],
         "generators": gens,
         "demands": demands,
         "lines": lines}))

@pgsim_app.route("/api/submit/", methods=["POST"])
def submit():
    """Submit a student design for evaluation.
    Requires the request header to contain a "team_name" entry to record the
    submission, and a "challenge_id".
    Requires the request data to be a json-wrapped list of dictionaries, each
    dict for each node with generators; each dict contains info on how many
    generators of each type that this node has. For example, for a 4+ node
    system, this could look like:
         [{'node': 0, 'generators': {} },
          {'node': 1, 'generators': {'H': 1}},
          {'node': 2, 'generators': {"N": 1}},
          {'node': 3, 'generators': {'H': 1, "N": 1, "R": 1}} ]

    Args:
        None.

    Returns:
        A status dict of the following entires:
        - "success" (boolean): whether the submission was successful or not. The
            submission would fail if the challenge ID is invalid, no
            dispatchable generators were used, max number of attempts was
            reached, minimum waiting time hasn't been reached, or an error
            occured when writing to database.
        - "message" (str): an error message if "success" is False; otherwise,
            it's an info message with the submission time and attempt index.
        - "eval" (dict): see the return argument of eval_pg.calc_score.
    """

    # Retrieve the team name and challenge ID from the request header.
    team_name = request.headers["team_name"]
    team_id = db_utils.get_team_id(team_name)
    challenge_id = request.headers["challenge_id"]
    if int(challenge_id) not in CHALLENGES:
        return make_response(json.dumps({
            'success': False,
            'message': "This challenge doesn't exist."}))

    # Convert the json data into a dictionary.
    submitted_data = request.get_data().decode('unicode_escape')
    submitted_data = json.loads(submitted_data)
    if sum([submitted_node["generators"].get("H", 0) + submitted_node["generators"].get("G", 0)
            for submitted_node in submitted_data]) == 0:
        return make_response(json.dumps({
            'success': False,
            'message': 'Please make use of at least one dispatchable generator (i.e. hydro or gas generator).'}))

    # Convert input design dict's structure into a structure used in our
    # backend. Assuming there are n nodes, such a structure is a list of n
    # dicts. Dict #i is the generator dict of node #i (e.g. {'H': 1, "N": 1}).
    max_node_idx = max([int(node["node"]) for node in submitted_data])
    gen_placements = [{} for i in range(max_node_idx + 1)]
    for submitted_node in submitted_data:
        gen_placements[int(submitted_node["node"])] = submitted_node["generators"]

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
        return make_response(json.dumps({
            'success': False,
            'message': "Need to wait {} until submit.".format(
                    str(timedelta(seconds=5) - sub_wait_time))}))

    # Check if the team still has enough allowed attempts left.
    sub_index = latest_submission_entry['num_attempt'] # Should start off at 0
    if sub_index >= MAX_SUBMISSION_ATTEMPTS:
        return make_response(json.dumps({
            'success': False,
            'message': "Max submission attempts reached."}))

    # Store the submitted design into the database.
    new_sys_info = {
       'new_sub_datetime': sub_date_time.strftime("%Y-%m-%d %H:%M:%S"),
       'new_num_attempts': sub_index + 1,
       'challenge_id': challenge_id
    }
    submission_id = db_utils.insert_submission_entry(gen_placements, team_id, new_sys_info)
    if submission_id < 0:
        return make_response(json.dumps({
            'success': False,
            'message': "Could not insert submission to database."}))

    # Pass the design into PyPower and other evaluation metric to calculate
    # generations, transmissions, cost, CO2 emissions, etc.
    data_module = CHALLENGES[int(challenge_id)]["data_module"]
    eval_results = eval_pg.calc_score(gen_placements, data_module)

    # Update the stored metrics of this team.
    db_utils.insert_scores_entry(challenge_id, submission_id, team_id, eval_results)

    return make_response(json.dumps({
            'success': True,
            'message': "{} Submission #{} successful.".format(
                    sub_date_time.strftime("%Y-%m-%d %H:%M:%S"), sub_index),
            'eval': eval_results}))

