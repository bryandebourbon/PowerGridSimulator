from pypower.api import runopf

import copy
import numpy as np

import pgsim.ppc_utils as ppc_utils, pgsim.read_pfresults as read_pfresults


from pypower.idx_bus import BUS_I, BUS_TYPE, PD, QD, GS, BS, BUS_AREA, \
    VM, VA, VMAX, VMIN, LAM_P, LAM_Q, MU_VMAX, MU_VMIN, REF
from pypower.idx_gen import GEN_BUS, PG, QG, QMAX, QMIN, GEN_STATUS, \
    PMAX, PMIN, MU_PMAX, MU_PMIN, MU_QMAX, MU_QMIN
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

# TODO: Return more info back up for the students to see; e.g. transmission line
# usage, demand for each node, environmental impact (pending Kevin's imput), etc.
def calc_score(gen_placements):
    gens, fixed_gens, gen_caps, gen_costs = ppc_utils.build_gen_matrices(gen_placements)
    bus_data = ppc_utils.build_bus_data(gen_placements)

    total_loss = 0
    total_cost = 0
    total_CO2 = 0
    overall_pass = True
    overall_trans = {
            (int(line[0])-1, int(line[1])-1): {"real_power":[], "reactive_power":[]} 
            for line in ppc_utils.transmission_limits
        }
    overall_nodes = {
            bus_idx: {  "supplied":     {"real":[], "reactive":[]}, 
                        "generated":    {"real":[], "reactive":[]}
                    } for bus_idx in range(ppc_utils.node_count)
        }
    for time in range(ppc_utils.timestep_count):
        # Construct a ppc to be passed into runopf().
        # Fill in the data constant across timesteps.
        ppc = {
            "version":  '2', 
            "baseMVA":  100.0, 
            "branch":   ppc_utils.transmission_limits,
            "gencost":  gen_costs
        }

        # Fill in the timestep-specific generation capacities.
        cur_gen = copy.deepcopy(gen_caps)
        cur_gen[:, PMAX] = np.array([ppc_utils.gen_types[gen[1]]["real_capacity"][time] for gen in gens])
        cur_gen[:, QMAX] = 0.75 * cur_gen[:, PMAX] # Set reactive gen cap to be 0.75 of the real gen cap.
        cur_gen[:, QMIN] = -0.75 * cur_gen[:, PMAX]
        ppc["gen"] = cur_gen

        # Fill in the timestep-specific demand numbers.
        bus_data[:, PD] = ppc_utils.real_demand_profiles[time]
        bus_data[:, QD] = ppc_utils.reactive_demand_profiles[time]
        ppc["bus"] = bus_data

        # Pass the input data into runopf().
        pf_results = runopf(ppc)
        pf_metrics = read_pfresults.convert_to_metrics(pf_results)

        # Update the overall metrics with runopf() results.
        overall_pass = overall_pass and pf_metrics["passed"]
        total_loss += pf_metrics["loss"] # Increment the loss
        total_cost += pf_metrics["cost"] # Increment the cost
        for line, power in pf_metrics["transmissions"].items():
            for power_type, power_val in power.items():
                # Append the transmission values of this timestep.
                overall_trans[line][power_type].append(power_val)
        for node, power in pf_metrics["buses"].items():
            for sup_or_gen, data in power.items():
                for real_or_not, power_val in data.items():
                    # Append the supply and generation values for all buses of this timestep.
                    overall_nodes[node][sup_or_gen][real_or_not].append(power_val)
        assert len(pf_metrics["gen"]) == gens.shape[0], "Not all generator values were returned"
        total_CO2 += sum([pf_metrics["gen"][i] * 
            ppc_utils.gen_types[gen[1]]["unit_CO2"] 
            for i, gen in enumerate(gens)])        
        
        # Add the cost and CO2 for negative-demand generators. 
        total_cost += sum([ppc_utils.calculate_poly_cost(gen[1], time) 
            for gen in fixed_gens])
        total_CO2 += sum([ppc_utils.gen_types[gen[1]]["unit_CO2"] * 
            ppc_utils.gen_types[gen[1]]["real_capacity"][time]
            for gen in fixed_gens])

        # Add the supply and generation values for negative demand.
        for gen in fixed_gens:
            node = int(gen[0])
            gen_type = gen[1]
            real_cap = ppc_utils.gen_types[gen_type]["real_capacity"][time]
            reactive_cap = ppc_utils.gen_types[gen_type]["reactive_capacity"][time]
            overall_nodes[node]["supplied"]["real"][-1] += real_cap
            overall_nodes[node]["supplied"]["reactive"][-1] += reactive_cap
            overall_nodes[node]["generated"]["real"][-1] += real_cap
            overall_nodes[node]["generated"]["reactive"][-1] += reactive_cap

        print(pf_metrics["passed"])
        print("Loss calculated so far as follows: {}.".format(total_loss))
        #print(pf_metrics["transmissions"])
        #print(pf_metrics["buses"])
        print(pf_metrics["cost"])

    # Flatten the transmission line dictionaries, by pushing "from" and "to" into
    # the dictionaries themseleves.
    trans_list = [power for _, power in overall_trans.items()]
    line_idx = -1 
    for line, _ in overall_trans.items():
        line_idx += 1
        trans_list[line_idx]["from"] = line[0]
        trans_list[line_idx]["to"] = line[1]

    # Flatten the nodes dictionaries, by pushing bus_idx into the dictionaries 
    # themselves.
    nodes_list = [power for _, power in overall_nodes.items()]
    node_idx = -1
    for node, _ in overall_nodes.items():
        node_idx += 1
        nodes_list[node_idx]["node"] = node

    # Calculate the total installation cost. 
    installation_cost = 0
    for gen in np.vstack((gens, fixed_gens)):
        installation_cost += ppc_utils.gen_types[gen[1]]["installation_cost"]
    
    return {"cost": total_cost, 
            "installation_cost": installation_cost,
            "passed": overall_pass, 
            "CO2": total_CO2,
            "nodes": nodes_list,
            "lines": trans_list}


