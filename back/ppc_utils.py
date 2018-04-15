import csv, itertools, os, math, copy, numpy as np
from pypower.idx_brch import BR_R, BR_X, BR_B, RATE_A

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
    for line_idx in range(transmission_limits.shape[0]):
        divisor = (int(LINE_RATINGS[line_idx]) * 1000) ** 2 / transmission_limits[line_idx, RATE_A]
        for spec in [BR_R, BR_X, BR_B]:
            transmission_limits[line_idx, spec] = \
                LINE_LIBRARY[LINE_RATINGS[line_idx]][spec] * LINE_LENGTHS[line_idx] / divisor
    return transmission_limits

def build_gen_matrices(gen_placements, real_demand_profiles, gen_types):
    # Returns:
    #  - gens: a 2D array, each row is a generator, e.g. ['3', 'G']
    #  - fixed_gens: same format as gens, but for negative demand generators
    #  - gen_caps: the matrix to be put in ppc["gen"], only without the time-
    #               dependent generator capacity values
    #  - gen_costs: the matrix to be put in ppc["gencost"]

    # First column - node index (1-based), second column - name of gen type
    gens = np.zeros((0, 2)) # non-negative-demand gens, up for optimization
    fixed_gens = np.zeros((0, 2)) # negative-demand gens

    cur_real_demand_profiles = copy.deepcopy(real_demand_profiles)
    # Concatenate the generation capacity and cost matrics, and identify
    # negative demands (nuclear, wind, and solar).
    for node, placement in enumerate(gen_placements):
        for gen_type, count in placement.items():
            if count == 0: continue
            if gen_type in ["G", "H"]:  # Gen values need to be optimized
                temp = np.array([[node, gen_type],] * count)
                gens = np.vstack((gens, temp))
            elif gen_type in ["N", "S", "W"]: # Simply a negative demand, no need to go through runopf()
                cur_real_demand_profiles[:, node] -= gen_types[gen_type]["real_capacity"]
                if gen_type in ["W", "S"]: # Add a random Gaussian noise to wind and solar generation capacity
                    cur_real_demand_profiles[:, node] += np.random.normal(
                            scale=0.1*np.amax(gen_types[gen_type]["real_capacity"]),
                            size=gen_types[gen_type]["real_capacity"].shape)
                temp = np.array([[node, gen_type],] * count)
                fixed_gens = np.vstack((fixed_gens, temp))
            else:
                raise ValueError("Unrecognized generator type: {}".format(gen_type))

    gen_caps = np.vstack([GEN_BASELINE] * gens.shape[0])
    gen_caps[:,0] = gens[:,0].astype(int) + 1 # Set the correct node numbers

    gen_costs = np.array([gen_types[gen[1]]["real_cost"] for gen in gens])

    return gens, fixed_gens, gen_caps, gen_costs, cur_real_demand_profiles

def build_bus_data(gen_placements, bus_data):
    # Update the BUS_TYPE column according to generator placements.
    # Returns the matrix to be put in ppc["bus"], only without the time-
    # dependent demand values.
    for node, placement in enumerate(gen_placements):
        if node == 0: continue
        if sum(placement.values()) > 0: bus_data[node, 1] = 2
        else:                           bus_data[node, 1] = 1


    return bus_data
