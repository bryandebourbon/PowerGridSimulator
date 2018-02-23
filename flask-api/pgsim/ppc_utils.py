import numpy as np

# NOTE: PYPOWER'S INDEX STARTS FROM 1!

# Hardcoded transmission limits for all lines. The limits are constant over time.
# The lines are designed to connect adjacent Ontario power zones. 
# TODO: Update these limits with realistic transmission line values (pending 
# Kevin's input), and read from csv or database. 
transmission_limits = np.array([ 
    # fbus, tbus,   r,       x,        b, rateA, rateB, rateC, ratio, angle, status, angmin, angmax
        [1,   2, 0.01938, 0.05917, 0.0528, 9900,    0,      0,   0,     0,      1,     -360, 360],
        [2,   6, 0.05403, 0.22304, 0.0492, 9900,    0,      0,   0,     0,      1,     -360, 360],
        [2,   8, 0.04699, 0.19797, 0.0438, 9900,    0,      0,   0,     0,      1,     -360, 360],
        [3,   4, 0.05811, 0.17632, 0.034,  9900,    0,      0,   0,     0,      1,     -360, 360],
        [4,   5, 0.05695, 0.17388, 0.0346, 9900,    0,      0,   0,     0,      1,     -360, 360],
        [4,   6, 0.06701, 0.17103, 0.0128, 9900,    0,      0,   0,     0,      1,     -360, 360],
        [5,   6, 0.01335, 0.04211, 0,      9900,    0,      0,   0,     0,      1,     -360, 360],
        [5,   8, 0,       0.20912, 0,      9900,    0,      0,   0.978, 0,      1,     -360, 360],
        [6,   8, 0,       0.55618, 0,      9900,    0,      0,   0.969, 0,      1,     -360, 360],
        [7,   8, 0,       0.25202, 0,      9900,    0,      0,   0.932, 0,      1,     -360, 360],
        [8,   9, 0,       0.11001, 0,      9900,    0,      0,   0,     0,      1,     -360, 360],
        [8,  10, 0,       0.11001, 0,      9900,    0,      0,   0,     0,      1,     -360, 360]
    ])

# Hardcoded demand profiles for each timestep for all the buses. (Number of rows
# == number of timesteps; number of columns == number of buses.)
# TODO: Read a longer time series of the demand profiles from csv or database.
real_demand_profiles = np.array([ 
    [4.85, 14.53, 9.58,  12.12, 57.74, 10.21, 0.71,   30.78, 4.72,  13.98],
    [4.85, 14.52, 9.55,  12.12, 57.77, 10.20, 0.71,   30.81, 4.72,  14.00],
    [4.85, 14.52, 9.53,  12.13, 57.81, 10.19, 0.71,   30.84, 4.73,  14.02],
    [4.84, 14.51, 9.50,  12.13, 57.84, 10.19, 0.71,   30.87, 4.73,  14.04],
    [4.84, 14.50, 9.47,  12.13, 57.87, 10.18, 0.71,   30.89, 4.73,  14.06],
    [4.84, 14.50, 9.44,  12.13, 57.91, 10.17, 0.71,   30.92, 4.73,  14.08]
])
reactive_demand_profiles = np.array([
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.],
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.],
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.],
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.],
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.],
    [ 0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.,  0.]
])
timestep_count = real_demand_profiles.shape[0]
node_count = real_demand_profiles.shape[1]
assert timestep_count == reactive_demand_profiles.shape[0], "Demand profiles for real power and reactive power must span the same time period"
assert node_count == real_demand_profiles.shape[1], "Demand profiles for real power and reactive power must specify the same number of nodes"

# Specs of buses. Note that the Pd Qd here are dummy values and will be updated
# with the values in *_demand_profiles matrices. Vm Va are calculated by runopf().
bus_data = np.array([
    # bus_i type Pd     Qd  Gs Bs area Vm     Va baseKV zone Vmax Vmin
        [1,  3,  0,    0,   0, 0,  1, 1.06,    0,    0, 1, 1.06, 0.94],
        [2,  1, 21.7, 12.7, 0, 0,  1, 1.045,  -4.98, 0, 1, 1.06, 0.94],
        [3,  1, 94.2, 19,   0, 0,  1, 1.01,  -12.72, 0, 1, 1.06, 0.94],
        [4,  1, 47.8, -3.9, 0, 0,  1, 1.019, -10.33, 0, 1, 1.06, 0.94],
        [5,  1,  7.6,  1.6, 0, 0,  1, 1.02,   -8.78, 0, 1, 1.06, 0.94],
        [6,  1, 11.2,  7.5, 0, 0,  1, 1.07,  -14.22, 0, 1, 1.06, 0.94],
        [7,  1,  0,    0,   0, 0,  1, 1.062, -13.37, 0, 1, 1.06, 0.94],
        [8,  1,  0,    0,   0, 0,  1, 1.09,  -13.36, 0, 1, 1.06, 0.94],
        [9,  1, 29.5, 16.6, 0, 0,  1, 1.056, -14.94, 0, 1, 1.06, 0.94],
        [10, 1,  9,    5.8, 0, 0,  1, 1.051, -15.1,  0, 1, 1.06, 0.94]
    ])
assert node_count == bus_data.shape[0], "Demand profiles and bus data must specify the same number of nodes"

# Specs of generators. Note that the Pmax Qmax here are dummy values and will be
# updated given the generator placements. Pg Qg are calculated by runopf().
gen_baseline = np.array(
    # bus,  Pg, Qg, Qmax, Qmin, Vg, mBase, status, Pmax, Pmin, ...
        [1, 0,  0,  0,      0,  1.00,  100, 1, 332.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )

# Hardcoded generator parameters for each generator type over a time series.
# TODO: Update the cost functions (pending Kevin's input).
# TODO: Read these from csv or database (?) and over longer time series.
# TODO: Consider making the capacity location-dependent; e.g. not all 
# locations can support a lot of hydro generation.
# TODO: Consider making the cost time-dependent; e.g. cheaper to generator at night.
gen_types = {
    "G":   {"real_capacity": np.full((6), 25), 
            "reactive_capacity": np.zeros(6),
            "real_cost": np.array([2, 0., 0., 3, 0.25, 10, 0]),
            "count": 10,
            "per_node_limit": {node:10 for node in range(10)}},
    "H":   {"real_capacity": np.full((6), 12), 
            "reactive_capacity": np.zeros(6),
            "real_cost": np.array([2, 0., 0., 3, 0.25, 10, 0]),
            "count": 10,
            "per_node_limit": {0:1, 1:2, 2:0, 3:2, 4:0, 5:1, 6:0, 7:1, 8:2, 9:1}}, 
    "N":   {"real_capacity": np.full((6), 25), 
            "reactive_capacity": np.zeros(6),
            "real_cost": np.array([2, 0., 0., 3, 0.2, 20, 0]),
            "count": 10,
            "per_node_limit": {node:10 for node in range(10)}}, 
    "S":   {"real_capacity": np.array([0.065, 0.18, 0.235, 0.31, 0.325, 0.245]), 
            "reactive_capacity": np.zeros(6),
            "real_cost": np.array([2, 0., 0., 3, 0.05, 5, 0]),
            "count": 10,
            "per_node_limit": {node:5 for node in range(10)}},
    "W":   {"real_capacity": np.array([5.374, 5.61, 5.612, 5.718, 5.31, 4.534]), 
            "reactive_capacity": np.zeros(6),
            "real_cost": np.array([2, 0., 0., 3, 0.05, 5, 0]),
            "count": 10,
            "per_node_limit": {node:10 for node in range(10)}}
}

for _, gen_profile in gen_types.items():
    assert (timestep_count == gen_profile["real_capacity"].shape[0]), "Demand profiles and generation profiles must specify the same number of timesteps"

def build_gen_matrices(gen_placements):
    assert node_count == len(gen_placements), "Must specify generator placements at all nodes"
    gens = np.zeros((0, 2)) # First column - node index (1-based), second column - name of gen type

    # Concatenate the generation capacity and cost matrics, and identify
    # negative demands (nuclear, wind, and solar).
    for node, placement in enumerate(gen_placements):
        for gen_type, count in placement.items():
            if count == 0: continue
            if gen_type in ["G", "H"]:  # Gen values need to be optimized
                temp = np.array([[node + 1, gen_type],] * count)
                gens = np.vstack((gens, temp))
            else: # Simply a negative demand, no need to go through runopf()
                real_demand_profiles[:, node] -= gen_types[gen_type]["real_capacity"]
                # TODO: Add a fixed cost for negative demands. 

    gen_count = gens.shape[0]

    gen_caps =  np.vstack([gen_baseline] * gen_count)
    gen_caps[:,0] = gens[:,0].astype(int)

    gen_costs = np.array([gen_types[gen[1]]["real_cost"] for gen in gens])
    
    return gens[:,1], gen_caps, gen_costs

def build_bus_data(gen_placements):
    assert node_count == len(gen_placements), "Must specify generator placements at all nodes"

    # Update the BUS_TYPE column according to generator placements. 
    for node, placement in enumerate(gen_placements):
        if sum(placement.values()) > 0 and bus_data[node, 1] == 1:
            bus_data[node, 1] = 2

    return bus_data
