from pypower.api import runopf

import copy
import numpy as np
import read_pfresults
import ppc_utils
from ppc_utils import real_gen_caps
from pypower.idx_bus import BUS_I, BUS_TYPE, PD, QD, GS, BS, BUS_AREA, \
    VM, VA, VMAX, VMIN, LAM_P, LAM_Q, MU_VMAX, MU_VMIN, REF
from pypower.idx_gen import GEN_BUS, PG, QG, QMAX, QMIN, GEN_STATUS, \
    PMAX, PMIN, MU_PMAX, MU_PMIN, MU_QMAX, MU_QMIN
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

# TODO: Return more info back up for the students to see; e.g. transmission line
# usage, demand for each node, etc.
def calc_score(gen_placements):
    gens, gen_caps, gen_costs = ppc_utils.build_gen_matrices(gen_placements)
    bus_data = ppc_utils.build_bus_data(gen_placements)
    total_loss = 0
    total_cost = 0
    overall_pass = True
    for time in range(ppc_utils.timestep_count):
        # Construct a ppc to be passed into runopf().
        # Fill in the data constant across timesteps.
        ppc = {
            "version":  '2', 
            "baseMVA":  100.0, 
            "branch":   ppc_utils.transmission_limits,
            "gencost":  gen_costs
        }

        # Fill in the timestep-specific demand numbers.
        bus_data[:, PD] = ppc_utils.real_demand_profiles[time]
        bus_data[:, QD] = ppc_utils.reactive_demand_profiles[time]
        ppc["bus"] = bus_data

        # Fill in the timestep-specific generation capacities.
        cur_gen = copy.deepcopy(gen_caps)
        cur_gen[:, PMAX] = np.array([real_gen_caps[gen][time] for gen in gens])
        cur_gen[:, QMAX] = 0.75 * cur_gen[:, PMAX]
        cur_gen[:, QMIN] = -0.75 * cur_gen[:, PMAX]
        ppc["gen"] = cur_gen

        # Pass the input data into runopf().
        pf_results = runopf(ppc)
        pf_metrics = read_pfresults.convert_to_metrics(pf_results)

        total_loss += pf_metrics["loss"]
        total_cost += pf_metrics["cost"]
        overall_pass = overall_pass and pf_metrics["passed"]

        print(pf_metrics["passed"])
        print("Loss calculated so far as follows: {}.".format(total_loss))
        print(pf_metrics["transmissions"])
        print(pf_metrics["buses"])
        print(pf_metrics["cost"])
    return {"loss": total_loss, "cost": total_cost, "passed": overall_pass}

