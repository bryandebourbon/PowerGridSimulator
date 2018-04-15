"""This module evaluates the generation design and returns relevant metrics.
"""

import copy, numpy as np

from pypower.api import runopf
from pypower.idx_bus import BUS_I, BUS_TYPE, PD, QD, GS, BS, BUS_AREA, \
    VM, VA, VMAX, VMIN, LAM_P, LAM_Q, MU_VMAX, MU_VMIN, REF
from pypower.idx_gen import GEN_BUS, PG, QG, QMAX, QMIN, GEN_STATUS, \
    PMAX, PMIN, MU_PMAX, MU_PMIN, MU_QMAX, MU_QMIN
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

import ppc_utils, pfresults_utils, ppc_ontario_data, ppc_northern_ontario_data

def calc_score(gen_placements, data_module):
    """

    Args:
        gen_placements (list): A list of dictionaries, each dict representing
            one bus node. Each dict has the generator types as keys, and the
            number of such generators installed as values. E.g. {'H': 1, "N": 2}
            means this node has 1 hydro generator and 2 nuclear generators
            installed.
        data_module (module): The data module, i.e. ppc_*_data.
    Returns:
        A metrics dictionary with the following entries:
        - "passed" (boolean): whether the optimization convered or not
        - "message" (str): additional info
        - "cost" (float): total generation cost if optimization converged,
            otherwise 0
        - "installation_cost" (float): total generator installation cost
        - "CO2" (float): total CO2 footprint if optimization converged,
            otherwise 0
        - "nodes" (dict): dictionary containing info for each node, with entries
            "node" (node index), "supplied" (a dictionary with "real" and
            "reactive" as keys, each with a list of values, one for each time-
            step), "generated" (same format as "supplied"), "demands" (same
            format as "supplied")
        - "lines" (dict): dictionary containing info for each transmission line,
            with entries "from" (from node index), "to" (to node index), "real_
            power" (a list of real power transmitted on the line, one for each
            timestep), "reactive_power" (same format), "capacity" (a float
            representing the constant line capacity)
    """

    gens, fixed_gens, gen_caps, gen_costs, cur_real_demand_profiles = \
        ppc_utils.build_gen_matrices(
            gen_placements, data_module.real_demand_profiles, data_module.gen_types)
    bus_data = ppc_utils.build_bus_data(gen_placements, data_module.bus_data)

    total_loss = 0
    total_cost = 0
    total_CO2 = 0
    overall_pass = True
    overall_trans = {
            (int(line[F_BUS])-1, int(line[T_BUS])-1):
            {"real_power":[], "reactive_power":[], "capacity": float(line[RATE_A])}
            for line in data_module.transmission_limits
        }
    overall_nodes = {
            bus_idx: {  "supplied":     {"real":[], "reactive":[]},
                        "generated":    {"real":[], "reactive":[]},
                        "demands":      {"real": data_module.real_demand_profiles[:,bus_idx].tolist(),
                                         "reactive": data_module.reactive_demand_profiles[:,bus_idx].tolist()}
                    } for bus_idx in range(data_module.NODE_COUNT)
        }

    for time in range(data_module.TIMESTEP_COUNT):
        # Construct a ppc to be passed into runopf().
        # Fill in the data constant across timesteps.
        ppc = {
            "version":  '2',
            "baseMVA":  100.0,
            "branch":   data_module.transmission_limits,
            "gencost":  gen_costs
        }

        # Fill in the timestep-specific generation capacities.
        cur_gen = copy.deepcopy(gen_caps)
        cur_gen[:, PMAX] = np.array([data_module.gen_types[gen[1]]\
                ["real_capacity"][time] for gen in gens])
        cur_gen[:, PMIN] = 0.3 * cur_gen[:, PMAX]
        cur_gen[:, QMAX] = 0.75 * cur_gen[:, PMAX] # Set reactive gen cap to be 0.75 of the real gen cap
        cur_gen[:, QMIN] = -0.75 * cur_gen[:, PMAX]
        ppc["gen"] = cur_gen

        # Fill in the timestep-specific demand numbers.
        bus_data[:, PD] = cur_real_demand_profiles[time]
        bus_data[:, QD] = data_module.reactive_demand_profiles[time]
        ppc["bus"] = bus_data

        # Pass the input data into runopf().
        pf_results = runopf(ppc)
        pf_metrics = pfresults_utils.convert_to_metrics(pf_results)

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
            data_module.gen_types[gen[1]]["unit_CO2"]
            for i, gen in enumerate(gens)])

        # Add the cost and CO2 for negative-demand generators.
        total_cost += sum([pfresults_utils.calculate_real_cost(
            data_module.gen_types[gen[1]]["real_capacity"][time],
            data_module.gen_types[gen[1]]["real_cost"])
            for gen in fixed_gens])
        total_CO2 += sum([data_module.gen_types[gen[1]]["unit_CO2"] *
            data_module.gen_types[gen[1]]["real_capacity"][time]
            for gen in fixed_gens])

        # Add the supply and generation values for negative demand.
        for gen in fixed_gens:
            node = int(gen[0])
            gen_type = gen[1]
            real_cap = data_module.gen_types[gen_type]["real_capacity"][time]
            reactive_cap = data_module.gen_types[gen_type]["reactive_capacity"][time]
            overall_nodes[node]["supplied"]["real"][-1] += real_cap
            overall_nodes[node]["supplied"]["reactive"][-1] += reactive_cap
            overall_nodes[node]["generated"]["real"][-1] += real_cap
            overall_nodes[node]["generated"]["reactive"][-1] += reactive_cap

        print(pf_metrics["passed"])

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
        installation_cost += data_module.gen_types[gen[1]]["installation_cost"]

    return {"cost": total_cost if overall_pass else 0,
            "message": "Power flow optimization converged! You have satisfied all the demands and constraints." if overall_pass else \
                "Power flow optimization did not converge. The generation, supply, and load power displayed below are the value before divergence and only for your reference.",
            "installation_cost": installation_cost,
            "passed": overall_pass,
            "CO2": total_CO2 if overall_pass else 0,
            "nodes": nodes_list,
            "lines": trans_list}


