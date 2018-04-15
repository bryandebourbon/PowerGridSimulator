"""This module contains helper functions for building the input matrices
required by PyPower's runopf() function.
"""

import copy, numpy as np
from pypower.idx_brch import BR_R, BR_X, BR_B, RATE_A
from pypower.idx_bus import BUS_TYPE

# Base specs of generators; see Table B-2 in MatPower manual for the meaning of
# each column. Note that the bus, Pg, Qg, Qmax, Qmin, Pmax, Pmin values here are
# dummy values - bus will be updated with the bus index; Qmax, Qmin, Pmax, Pmin
# will be filled in with time-dependent values; Pg and Qg will be calculated by
# runopf(). The point here is to specifcy the other values that are constant
# across all generators: Vg, mBase, status, etc.
GEN_BASELINE = np.array(
    # bus,  Pg, Qg, Qmax, Qmin, Vg,  mBase, status, Pmax, Pmin, ...
        [1, 0,  0,  0,      0,  1.00,  100, 1, 332.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )

STRAIGHT_DISTANCES = np.array([600,430,130,180,150,100,200,100,120,160])
LINE_LENGTHS = 1.3 * STRAIGHT_DISTANCES
LINE_RATINGS = np.array(["243", "500", "500", "500", "500", "243", "243", "243", "243", "243"])
LINE_LIBRARY = {"243": {BR_R: 0.04, BR_X: 0.4, BR_B: 0},
                "500": {BR_R: 0.02, BR_X: 0.3, BR_B: 0}}

def build_line_matrics(transmission_limits):
    """Returns the transmission line matrix in the PyPower-friendly format.

    Args:
        transmission_limits (np.array): The base transmission line matrix with
            all columns filled in, except for BR_R (resistance), BR_X
            (reactance), and BR_B (susceptance).

    Returns:
        The transmission line matrix with BR_R, BR_X, and BR_B calculated, based
        on the line lengths, line ratings, and unit R/X/B (see constants above).
    """

    for line_idx in range(transmission_limits.shape[0]):
        divisor = (int(LINE_RATINGS[line_idx]) * 1000) ** 2 / \
                transmission_limits[line_idx, RATE_A]
        for spec in [BR_R, BR_X, BR_B]:
            transmission_limits[line_idx, spec] = \
                    LINE_LIBRARY[LINE_RATINGS[line_idx]][spec] * \
                    LINE_LENGTHS[line_idx] / divisor
    return transmission_limits

def build_gen_matrices(gen_placements, real_demand_profiles, gen_types):
    """Returns all the generator-related matrices used by the evaluator.

    Args:
        gen_placements (list): A list of dictionaries, each dict representing
            one bus node. Each dict has the generator types as keys, and the
            number of such generators installed as values. E.g. {'H': 1, "N": 2}
            means this node has 1 hydro generator and 2 nuclear generators
            installed.
        real_demand_profiles (np.array): The demand matrix from data modules
            (i.e. ppc_*_data.real_demand_profiles); each row represents a
            timestep, each column represents a node.
        gen_types (dict): The generation info dictionary from data modules
            (i.e. ppc_*_data.gen_types).

    Returns:
        gens (np.array): An Nx2 array; each row represents a dispatchable
            generator and is of the format [node index, generator name] (e.g.
            ['3', 'G']).
        fixed_gens (np.array): An Mx2 array; same format as gens, except for
            non-dispatchable generators.
        gen_caps (np.array): GEN_BASELINE stacked N times, with the correct bus
            indices; i.e. the generator matrix in the PyPower-friendly format,
            but without Pg, Qg, Qmax, Qmin, Pmax, Pmin values filled in yet.
        gen_costs (np.array): The generation cost matrix in the PyPower-friendly
            format.
        cur_real_demand_profiles (np.array): An TxB array, T = number of time-
            steps, B = number of bus nodes. It is the demand profile substracted
            with non-dispatchable generations (i.e. negative demands).
    """

    gens = np.zeros((0, 2))
    fixed_gens = np.zeros((0, 2))
    cur_real_demand_profiles = copy.deepcopy(real_demand_profiles)

    for node, placement in enumerate(gen_placements):
        for gen_type, count in placement.items():
            if count == 0: continue
            # Dispatchable generator, i.e. with optimizable generation.
            if gen_type in ["G", "H"]:
                gens = np.vstack((gens, np.array([[node, gen_type],] * count)))
            # Non-dispatchable generator, i.e. negative demands.
            elif gen_type in ["N", "S", "W"]:
                cur_real_demand_profiles[:, node] -= gen_types[gen_type]["real_capacity"]
                # Add a random Gaussian noise to wind and solar generation capacity
                if gen_type in ["W", "S"]:
                    cur_real_demand_profiles[:, node] += np.random.normal(
                            scale=0.1*np.amax(gen_types[gen_type]["real_capacity"]),
                            size=gen_types[gen_type]["real_capacity"].shape)
                fixed_gens = np.vstack((fixed_gens, np.array([[node, gen_type],] * count)))
            else:
                raise ValueError("Unrecognized generator type: {}".format(gen_type))

    gen_caps = np.vstack([GEN_BASELINE] * gens.shape[0])
    gen_caps[:,0] = gens[:,0].astype(int) + 1 # Set the correct node numbers
    gen_costs = np.array([gen_types[gen[1]]["real_cost"] for gen in gens])

    return gens, fixed_gens, gen_caps, gen_costs, cur_real_demand_profiles

def build_bus_data(gen_placements, bus_data):
    """Returns the bus matrix in the PyPower-friendly format.

    Args:
        gen_placements (list): A list of dictionaries, each dict representing
            one bus node. Each dict has the generator types as keys, and the
            number of such generators installed as values. E.g. {'H': 1, "N": 2}
            means this node has 1 hydro generator and 2 nuclear generators
            installed.
        bus_data (np.array): The bus matrix from data modules (i.e. ppc_*_data.
            bus_data); each row represents a bus node.

    Returns:
        The bus_data matrix, but with the BUS_TYPE column updated: if the node
        has generators, it should be type 2; if not, it should be type 1; the
        reference node (node #0 in our case) should remain as type 3.
    """

    for node, placement in enumerate(gen_placements):
        if node == 0: continue
        if sum(placement.values()) > 0: bus_data[node, BUS_TYPE] = 2
        else:                           bus_data[node, BUS_TYPE] = 1
    return bus_data
