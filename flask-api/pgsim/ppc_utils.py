import numpy as np

# NOTE: PYPOWER'S INDEX STARTS FROM 1!

# Hardcoded transmission limits for all lines. The limits are constant over time.
# The lines are designed to connect adjacent Ontario power zones. 
# TODO: Update these limits with realistic transmission line values, and read 
# from csv or database. 
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
    [485,1453,958,1212,5774,1021,71,3078,472,1398],
    [485,1452,955,1212,5777,1020,71,3081,472,1400],
    [485,1452,953,1213,5781,1019,71,3084,473,1402],
    [484,1451,950,1213,5784,1019,71,3087,473,1404],
    [484,1450,947,1213,5787,1018,71,3089,473,1406],
    [484,1450,944,1213,5791,1017,71,3092,473,1408]
])
reactive_demand_profiles = np.array([
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
])
timestep_count = real_demand_profiles.shape[0]
node_count = real_demand_profiles.shape[1]
assert timestep_count == reactive_demand_profiles.shape[0], "Demand profiles for real power and reactive power must span the same time period"
assert node_count == real_demand_profiles.shape[1], "Demand profiles for real power and reactive power must specify the same number of nodes"

# Specs of buses. Note that the Pd Qd here are dummy values and will be updated
# with the values in *_demand_profiles matrices. Vm Va are calculated by runopf().
# TODO: Update these with Ontario bus specs. 
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
# TODO: Update these with real specs. 
gen_baseline = np.array(
    # bus,  Pg, Qg, Qmax, Qmin, Vg, mBase, status, Pmax, Pmin, ...
        [1, 0,  0,  332.4, -332.4,  1.00,  100, 1, 332.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )

# Hardcoded generator capacity profiles for each generator type over a time series.
# TODO: Update these with realistically estimated values, over a longer time 
# series, and read from csv or database.
# TODO: Consider making these profiles location-dependent; e.g. not all 
# locations can support a lot of hydro generation.
real_gen_caps = {
    "G":   np.array([200, 400, 600, 600, 400, 400]), 
    "H":   np.array([200, 400, 600, 600, 400, 400]), 
    "N":   np.array([300, 300, 300, 300, 300, 300]), 
    "S":   np.array([50, 70, 110, 120, 120, 60]),
    "W":   np.array([40, 60, 100, 110, 110, 50])
}
for _, gen_profile in real_gen_caps.items():
    assert (timestep_count == gen_profile.shape[0]), "Demand profiles and generation profiles must specify the same number of timesteps"

# Hardcoded generator cost profiles for each generator type, constant over time.
# Here we are assuming 2nd order polynomial factors, which is up to change.
# TODO: Update these with realistic cost functions. 
# TODO: Consider making the cost time-dependent; e.g. cheaper to generator at night.
real_gen_cost = {
                   # 2 startup shutdown n c(n-1) ... c0
    "G":   np.array([2, 0., 0., 3, 0.25, 10, 0]), 
    "H":   np.array([2, 0., 0., 3, 0.25, 10, 0]), 
    "N":   np.array([2, 0., 0., 3, 0.2, 20, 0]), 
    "S":   np.array([2, 0., 0., 3, 0.05, 5, 0]),
    "W":   np.array([2, 0., 0., 3, 0.05, 5, 0])
}

def build_gen_matrices(gen_placements):
    assert node_count == len(gen_placements), "Must specify generator placements at all nodes"
    gens = np.zeros((0, 2)) # First column - node index (1-based), second column - name of gen type

    for node, placement in enumerate(gen_placements):
        for gen_type, count in placement.items():
            if count == 0: continue
            if gen_type in ["G", "H"]:  # Gen values need to be optimized
                temp = np.array([[node + 1, gen_type],] * count)
                gens = np.vstack((gens, temp))
            else: # Simply a negative demand, no need to go through runopf()
                real_demand_profiles[:, node] -= real_gen_caps[gen_type]
                # TODO: Add a fixed cost for negative demands. 
    gen_count = gens.shape[0]

    gen_caps =  np.vstack([gen_baseline] * gen_count)
    gen_caps[:,0] = gens[:,0].astype(int)

    gen_costs = np.array([real_gen_cost[gen[1]] for gen in gens])
    
    return gens[:,1], gen_caps, gen_costs

def build_bus_data(gen_placements):
    assert node_count == len(gen_placements), "Must specify generator placements at all nodes"

    for node, placement in enumerate(gen_placements):
        if sum(placement.values()) > 0 and bus_data[node, 1] == 1:
            bus_data[node, 1] = 2

    return bus_data
