from pypower.api import runopf

import numpy as np
import read_pfresults
import ppc_utils
from ppc_utils import gen_baseline, cost_baseline
from pypower.idx_bus import BUS_I, BUS_TYPE, PD, QD, GS, BS, BUS_AREA, \
    VM, VA, VMAX, VMIN, LAM_P, LAM_Q, MU_VMAX, MU_VMIN, REF
from pypower.idx_gen import GEN_BUS, PG, QG, QMAX, QMIN, GEN_STATUS, \
    PMAX, PMIN, MU_PMAX, MU_PMIN, MU_QMAX, MU_QMIN
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

# TODO: Return more info back up for the students to see; e.g. transmission line
# usage, demand for each node, etc.
def calc_score(gen_placements):
    real_gen_values, reactive_gen_values, real_gen_costs, reactive_gen_costs = ppc_utils.calc_gen_values(gen_placements)
    total_loss = 0
    total_cost = 0
    overall_pass = True
    for time in range(ppc_utils.timestep_count):
        # Construct a ppc to be passed into runopf().
        ppc = {
            "version":  '2', 
            "baseMVA":  100.0, 
            "branch":   ppc_utils.transmission_limits
        }

        bus = ppc_utils.bus_data
        bus[:, PD] = ppc_utils.real_demand_profiles[time]
        bus[:, QD] = ppc_utils.reactive_demand_profiles[time]
        ppc["bus"] = bus

        real_gen, reactive_gen = real_gen_values[time, :], reactive_gen_values[time, :]
        cur_gen = np.zeros((0, gen_baseline.shape[0]))
        for node in range(ppc_utils.node_count):
            if real_gen[node] == 0 and reactive_gen[node] == 0:
                continue
            node_gen = gen_baseline
            node_gen[GEN_BUS], node_gen[PMAX], node_gen[QMAX] = node + 1, real_gen[node], reactive_gen[node]
            cur_gen = np.vstack((cur_gen, node_gen))

        active_gen_nodes_count = cur_gen.shape[0]
        cur_real_gencost = np.zeros((active_gen_nodes_count, cost_baseline.shape[0]))
        cur_reactive_gencost = np.zeros((active_gen_nodes_count, cost_baseline.shape[0]))
        for i in range(active_gen_nodes_count):
            node = int(cur_gen[i, 0]) - 1 # 0-based
            cur_real_gencost[i, :] = real_gen_costs[node, :]
            cur_reactive_gencost[i, :] = reactive_gen_costs[node, :]

        ppc["gen"] = cur_gen
        #ppc["gencost"] = np.vstack((cur_real_gencost, cur_reactive_gencost))
        ppc["gencost"] = cur_real_gencost

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

