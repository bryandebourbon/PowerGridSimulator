# Evaluation functions for PCC web system.
# Includes calculations for scores, analyses of power Flow
# results.

from pypower.api import runpf

import calc, prep

# The node number is implied by the index of the list returned by analyze demand.

def analyze_demand(load_values, timestep_num):

    analysis = []

    for i in range(len(load_values)):

        load_actual = load_values[i]
        demand_constraint = prep.demand_profile_for_node_over_time(i)[timestep_num]

        result = {
            'load_actual': load_actual,
            'demand_constraint': demand_constraint,
            'met_constraint': 1 if (load_actual >= demand_constraint) else 0
        }

        analysis.append(result)

    return analysis


# Analyze transmission data.

def analyze_transmission(transmission_values):

    analysis = []

    for i in range(len(transmission_values)):

        transmission_actual = abs(transmission_values[i]['transmission'])
        transmission_limit = prep.transmission_limits_between_nodes(transmission_values[i]['from'] - 1, transmission_values[i]['to'] - 1)

        result = {
            'from': transmission_values[i]['from'],
            'to': transmission_values[i]['to'],
            'transmission_actual': transmission_actual,
            'transmission_limit': transmission_limit,
            'violation': 1 if (transmission_actual > transmission_limit) else 0
        }

        analysis.append(result)

    return analysis


# Compare two submissions scores, return true if first is better than second.

def is_better_score(first_sub, second_sub):

    # May need to account for pass/fail here

    return first_sub['overall_score'] > second_sub['overall_score']


# Evaluate scores for a submission, given submission in ppc timestep format.

def score_sub(ppc_timesteps):

    # Possibly class, make member function for summing score
    scorecard = {
        'score_efficiency': 0,
        'score_cost': 0,
        'score_CO2': 0,
        'score_constraints': 0,
        'overall_score': 0,

        'pass_fail': 0,
        'transmission_analysis': [],
        'demand_analysis': []
    }

    total_loss = 0
    total_loss_direction = -1

    # iterate across the timesteps
    for time in range(len(ppc_timesteps)):

        output_pf = runpf(ppc_timesteps[time])
        result = output_pf[0]

        total_loss = total_loss + calc.sum_loss(result)

        # Append --> there is one analysis per timestep
        scorecard['transmission_analysis'].append(analyze_transmission(calc.get_transmission_values(result)))

        scorecard['demand_analysis'].append(analyze_demand(calc.get_load_values(result), time))

        print("Loss calculated so far as follows: {}.".format(total_loss))

    scorecard['score_efficiency'] = total_loss * total_loss_direction

    # Possibly add weightings here when summing
    scorecard['overall_score'] = scorecard['score_efficiency'] + scorecard['score_cost'] + scorecard['score_CO2'] + scorecard['score_constraints']

    # TODO: Write code to set this flag later
    scorecard['pass_fail'] = 1

    return scorecard
