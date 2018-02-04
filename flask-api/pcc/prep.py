# Prepare data as needed in PCC web system.
# May query database to look up data.

# TODO: classes for each data structure

from numpy import array # To make ppc object.
from datetime import datetime

from numpy.random import randint # For randomized testing

import dbfunc


def transmission_limits_between_nodes(from_node_num, to_node_num):

    # Need condition to check if node_num within number of nodes.

    # Error - no self loops.
    if (from_node_num == to_node_num):
        return None

    if (from_node_num > to_node_num):
        from_node_num, to_node_num = to_node_num, from_node_num

    # vertical: from, horizontal: to
    transmission_limits_matrix = [
        [0,200,200,200,200,200,200,200,200,200,200,200,200,200],
        [0,0,200,200,200,200,200,200,200,200,200,200,200,200],
        [0,0,0,200,200,200,200,200,200,200,200,200,200,200],
        [0,0,0,0,200,200,200,200,200,200,200,200,200,200],
        [0,0,0,0,0,200,200,200,200,200,200,200,200,200],
        [0,0,0,0,0,0,200,200,200,200,200,200,200,200],
        [0,0,0,0,0,0,0,200,200,200,200,200,200,200],
        [0,0,0,0,0,0,0,0,200,200,200,200,200,200],
        [0,0,0,0,0,0,0,0,0,200,200,200,200,200],
        [0,0,0,0,0,0,0,0,0,0,200,200,200,200],
        [0,0,0,0,0,0,0,0,0,0,0,200,200,200],
        [0,0,0,0,0,0,0,0,0,0,0,0,200,200],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,200],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]

    print('{}, {}'.format(from_node_num, to_node_num))

    return transmission_limits_matrix[from_node_num][to_node_num]

# Note: node numbers are indexed from 0 within code

def demand_profile_for_node_over_time(node_num):

    # Need condition to check if node_num within number of nodes.

    demand_profiles_matrix = [
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25],
        [25,25,25,25,25,25]
    ]

    return demand_profiles_matrix[node_num]


# Later can add more types or make dependent on node location (i.e. node number) etc.

def gen_values_over_time(gen_type):

    if (gen_type == 'H'):
        gen_vals = array([10,20,30,30,30,20])
    elif (gen_type == 'N'):
        gen_vals = array([15,15,15,15,15,15])
    elif (gen_type == 'R'):
        gen_vals = array([5,7,11,12,12,6])
    elif (gen_type == 'Z'):
        gen_vals = array([0,0,0,0,0,0])
    else:
        return None

    return gen_vals


def matrix_from_submit_info(submit_info):

    matrix = []

    for node_index in range(len(submit_info)): # For all the nodes available (and that data was submitted for)...
        node_gen_vals = array([0,0,0,0,0,0])
        for gen_index in range(len(submit_info[node_index])): # For all the generators the team selected for this node...
            node_gen_vals = node_gen_vals + gen_values_over_time(submit_info[node_index][gen_index])
        matrix.append(node_gen_vals.tolist())

    return matrix


# Get list of all team ids registered for scoring.

def get_all_team_ids_score():

    team_ids = []

    for r in dbfunc.query_db('SELECT team_id FROM scores'):
        data = tuple(r)

        team_ids.append(data[0])

    return team_ids


# Get best scoring submission from all submissions, for a given team.

def get_best_overall_submit_id(team_id):

    best_submit_id = None
    best_score = None
    num_attempts = 0

    for r in dbfunc.query_db('SELECT submit_id, overall_score FROM submissions \
        WHERE team_id=?', (str(team_id),)):

        data = tuple(r)

        if best_submit_id == None:
            best_submit_id = data[0]
            best_overall_score = data[1]
        else:
            if best_overall_score < data[1]:
                best_submit_id = data[0]
                best_overall_score = data[1]

        num_attempts = num_attempts + 1

    return best_submit_id, num_attempts


# Jane
def make_leaderboard():
    return "Leaderboard"


def make_scores_entry(new_submission_entry):

    score_info = {
        'team_id': new_submission_entry['team_id'],
        'submit_id_best': new_submission_entry['submit_id'],
        'num_attempts': get_score(new_submission_entry['team_id'])['num_attempts'] + 1,
        'score_efficiency': new_submission_entry['score_efficiency'],
        'score_cost': new_submission_entry['score_cost'],
        'score_CO2': new_submission_entry['score_CO2'],
        'score_constraints': new_submission_entry['score_constraints'],
        'overall_score': new_submission_entry['overall_score'],
        'pass_fail': new_submission_entry['pass_fail']
    }

    return score_info

# Get score for a given team.

def get_score(team_id):

    score_info = {
        'team_id': None,
        'submit_id_best': None,
        'num_attempts': None,
        'score_efficiency': None,
        'score_cost': None,
        'score_CO2': None,
        'score_constraints': None,
        'overall_score': None,
        'pass_fail': None
    }

    #try:

        # Not use a for loop for querying 1 row
    for r in dbfunc.query_db('SELECT * FROM scores WHERE team_id=?', (str(team_id),)):
        data = tuple(r)

        score_info['team_id']           = data[0]
        score_info['submit_id_best']    = data[1]
        score_info['num_attempts']      = data[2]
        score_info['score_efficiency']  = data[3]
        score_info['score_cost']        = data[4]
        score_info['score_CO2']         = data[5]
        score_info['score_constraints'] = data[6]
        score_info['overall_score']     = data[7]
        score_info['pass_fail']         = data[8]

    #except:

    #    score_info = None

    return score_info

# Get maximum existing submission ID in the db.
# Assumes only positive submit ids

def get_max_submit_id():

    max_submit_id = 0

    for r in dbfunc.query_db('SELECT * FROM view_submit_ids'):
        data = tuple(r)

        if (data[0] > max_submit_id):
            max_submit_id = data[0]

    return max_submit_id


def get_submission_entry(submit_id):

    submission_info = {
        'submit_id': None,
        'date_time': None,
        'team_id': None,
        'submission': None,
        'score_efficiency': None,
        'score_cost': None,
        'score_CO2': None,
        'score_constraints': None,
        'overall_score': None,
        'pass_fail': None
    }

    for r in dbfunc.query_db('SELECT * from submissions WHERE submit_id=?', (str(submit_id),)):
        data = tuple(r)

        submission_info['submit_id']            = data[0]
        submission_info['date_time']            = data[1]
        submission_info['team_id']              = data[2]
        submission_info['submission']           = data[3]
        submission_info['score_efficiency']     = data[4]
        submission_info['score_cost']           = data[5]
        submission_info['score_CO2']            = data[6]
        submission_info['score_constraints']    = data[7]
        submission_info['overall_score']        = data[8]
        submission_info['pass_fail']            = data[9]

    return submission_info


def make_submission_entry(team_id, matrix, scorecard):

    dts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Protocol: make new submit id the current max + 1
    sid = get_max_submit_id() + 1

    tid = team_id

    ds = str(matrix)

    entry = {
        'submit_id': sid,
        'date_time': dts,
        'team_id': tid,
        'submission': ds,
        'score_efficiency': scorecard['score_efficiency'],
        'score_cost': scorecard['score_cost'],
        'score_CO2': scorecard['score_CO2'],
        'score_constraints': scorecard['score_constraints'],
        'overall_score': scorecard['overall_score'],
        'pass_fail': scorecard['pass_fail']
    }

    return entry

# Cleans submission into list of lists form ('matrix').

def clean_submission(submission):

    try:
        matrix = [[float(val) for val in elem[0].split(',')] for elem in submission]

    # Except likely ValueError.
    except:
        print("Error in submission input")
        return None

    return matrix


# Make ppc into list, each list entry a ppc at a timestep.

def make_ppc_timesteps(matrix):

    ppc_timesteps = []

    for i in range(len(matrix[0])):
        ppc = pcc_sample_case_14([gen[i] for gen in matrix])

        if (ppc is None):
            return None

        ppc_timesteps.append(ppc)

    return ppc_timesteps


# Get team data for authentication.

def get_team_auth_data():
    team_data = []

    for r in dbfunc.query_db('SELECT * FROM view_team_auth'):
        data = tuple(r)
        team_data.append(
            {'id': data[0], 'key': data[1], 'name': data[2]})

    return team_data


# Generate sample team data for given number of sample teams.

def generate_team_sample_data(num_teams):
    team_sample_data = []
    for i in range(num_teams):
        team_sample_data.append({'team_id': i, 'team_key': "kEy{0}".format(
            i + 60), 'team_name': "Team Name {0}".format(i + 90)})
    return team_sample_data


# Generate sample submissions for given numbers of submissions and teams.

def generate_submission_sample_data(num_submissions, num_teams):
    submission_sample_data = []
    for i in range(num_submissions):
        submission_sample_data.append({'submit_id': i, 'date_time': "somestring{0}".format(i),
            'team_id': i % num_teams, 'submission': "somestring{0}".format(i),
            'score_efficiency': 0, 'score_cost': 0, 'score_CO2': 0,
            'score_constraints': 0, 'overall_score': 0, 'pass_fail': 0})
    return submission_sample_data


# Generate zero scoring data for a given number of teams.

def generate_scores_zeroes(num_teams):
    scores_sample_data = []
    for i in range(num_teams):
        scores_sample_data.append({'team_id': i,
            'submit_id_latest': 0, 'num_attempts': 0,
            'score_efficiency': 0, 'score_cost': 0, 'score_CO2': 0,
            'score_constraints': 0, 'overall_score': 0, 'pass_fail': 0})
    return scores_sample_data


# Load ppc (PyPower Case) object used by runpf, accepts 14 generator power
# values.
#
# Has pypower.case14() default values. Customized to accept
# generator values as input.

def pcc_sample_case_14(generator_power_vals):

    if len(generator_power_vals) < 14:

        print("Error - supply more generator power values (rows in submit form).")
        return None

    ppc = {"version": '2'}
    ##-----  Power Flow Data  -----##
    ## system MVA base
    ppc["baseMVA"] = 100.0

    ## bus data
    # bus_i type Pd Qd Gs Bs area Vm Va baseKV zone Vmax Vmin
    ppc["bus"] = array([
        [1,  3,  0,    0,   0, 0,  1, 1.06,    0,    0, 1, 1.06, 0.94],
        [2,  2, 21.7, 12.7, 0, 0,  1, 1.045,  -4.98, 0, 1, 1.06, 0.94],
        [3,  2, 94.2, 19,   0, 0,  1, 1.01,  -12.72, 0, 1, 1.06, 0.94],
        [4,  1, 47.8, -3.9, 0, 0,  1, 1.019, -10.33, 0, 1, 1.06, 0.94],
        [5,  1,  7.6,  1.6, 0, 0,  1, 1.02,   -8.78, 0, 1, 1.06, 0.94],
        [6,  2, 11.2,  7.5, 0, 0,  1, 1.07,  -14.22, 0, 1, 1.06, 0.94],
        [7,  1,  0,    0,   0, 0,  1, 1.062, -13.37, 0, 1, 1.06, 0.94],
        [8,  2,  0,    0,   0, 0,  1, 1.09,  -13.36, 0, 1, 1.06, 0.94],
        [9,  1, 29.5, 16.6, 0, 19, 1, 1.056, -14.94, 0, 1, 1.06, 0.94],
        [10, 1,  9,    5.8, 0, 0,  1, 1.051, -15.1,  0, 1, 1.06, 0.94],
        [11, 1,  3.5,  1.8, 0, 0,  1, 1.057, -14.79, 0, 1, 1.06, 0.94],
        [12, 1,  6.1,  1.6, 0, 0,  1, 1.055, -15.07, 0, 1, 1.06, 0.94],
        [13, 1, 13.5,  5.8, 0, 0,  1, 1.05,  -15.16, 0, 1, 1.06, 0.94],
        [14, 1, 14.9,  5,   0, 0,  1, 1.036, -16.04, 0, 1, 1.06, 0.94]
    ])

    ## generator data
    # bus, Pg, Qg, Qmax, Qmin, Vg, mBase, status, Pmax, Pmin, Pc1, Pc2,
    # Qc1min, Qc1max, Qc2min, Qc2max, ramp_agc, ramp_10, ramp_30, ramp_q, apf

    # here, the generator values entered on react are input
    ppc["gen"] = array([
        [1, generator_power_vals[0],   -16.9, 10,   0, 1.06,  100, 1, 332.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [2, generator_power_vals[1],    42.4, 50, -40, 1.045, 100, 1, 140,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [3, generator_power_vals[2],    23.4, 40,   0, 1.01,  100, 1, 100,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [6, generator_power_vals[5],    12.2, 24,  -6, 1.07,  100, 1, 100,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [8, generator_power_vals[7],    17.4, 24,  -6, 1.09,  100, 1, 100,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ])

    ## branch data
    # fbus, tbus, r, x, b, rateA, rateB, rateC, ratio, angle, status, angmin, angmax
    ppc["branch"] = array([
        [1,   2, 0.01938, 0.05917, 0.0528, 9900, 0, 0, 0,     0, 1, -360, 360],
        [1,   5, 0.05403, 0.22304, 0.0492, 9900, 0, 0, 0,     0, 1, -360, 360],
        [2,   3, 0.04699, 0.19797, 0.0438, 9900, 0, 0, 0,     0, 1, -360, 360],
        [2,   4, 0.05811, 0.17632, 0.034,  9900, 0, 0, 0,     0, 1, -360, 360],
        [2,   5, 0.05695, 0.17388, 0.0346, 9900, 0, 0, 0,     0, 1, -360, 360],
        [3,   4, 0.06701, 0.17103, 0.0128, 9900, 0, 0, 0,     0, 1, -360, 360],
        [4,   5, 0.01335, 0.04211, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [4,   7, 0,       0.20912, 0,      9900, 0, 0, 0.978, 0, 1, -360, 360],
        [4,   9, 0,       0.55618, 0,      9900, 0, 0, 0.969, 0, 1, -360, 360],
        [5,   6, 0,       0.25202, 0,      9900, 0, 0, 0.932, 0, 1, -360, 360],
        [6,  11, 0.09498, 0.1989,  0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [6,  12, 0.12291, 0.25581, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [6,  13, 0.06615, 0.13027, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [7,   8, 0,       0.17615, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [7,   9, 0,       0.11001, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [9,  10, 0.03181, 0.0845,  0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [9,  14, 0.12711, 0.27038, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [10, 11, 0.08205, 0.19207, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [12, 13, 0.22092, 0.19988, 0,      9900, 0, 0, 0,     0, 1, -360, 360],
        [13, 14, 0.17093, 0.34802, 0,      9900, 0, 0, 0,     0, 1, -360, 360]
    ])

    ##-----  OPF Data  -----##
    ## generator cost data
    # 1 startup shutdown n x1 y1 ... xn yn
    # 2 startup shutdown n c(n-1) ... c0
    ppc["gencost"] = array([
        [2, 0, 0, 3, 0.0430293, 20, 0],
        [2, 0, 0, 3, 0.25,      20, 0],
        [2, 0, 0, 3, 0.01,      40, 0],
        [2, 0, 0, 3, 0.01,      40, 0],
        [2, 0, 0, 3, 0.01,      40, 0]
    ])

    return ppc


# Make a matrix from a "static" case i.e. always the same every time this
# funciton is called.

def make_sub_matrix_static_case(num_timesteps, num_generators, const_gen_val):
    matrix = [[const_gen_val for i in range(num_timesteps)] for i in range(num_generators)]

    return matrix


def make_sub_matrix_random_case(num_timesteps, num_generators, max_gen_value):
    matrix = [[randint(0, max_gen_value) for i in range(num_timesteps)] for i in range(num_generators)]
    return matrix
