"""This is the data module for the Ontario challenge.
"""

import os, numpy as np
import ppc_utils

TIMESTEP_START = 90
TIMESTEP_COUNT = 6
NODE_COUNT = 10

# Hardcoded specs for all transmission lines.
transmission_limits = np.genfromtxt(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/transmission_lines.csv"),
    delimiter=',')
transmission_limits = ppc_utils.build_line_matrics(transmission_limits)

# Hardcoded demand profiles for each timestep for all the buses. (Number of rows
# == number of timesteps; number of columns == number of buses.)
real_demand_profiles = np.genfromtxt(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/zonal_demands.csv"),
    delimiter=',')[TIMESTEP_START:TIMESTEP_START + TIMESTEP_COUNT, 2:].astype(int) / 100
reactive_demand_profiles = np.zeros((TIMESTEP_COUNT, NODE_COUNT))

# Specs of buses. Note that the Pd Qd here are dummy values and will be updated
# with the time-dependent values in *_demand_profiles matrices. Vm Va are
# calculated by runopf().
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
assert NODE_COUNT == bus_data.shape[0], "Demand profiles and bus data must specify the same number of nodes"

# Hardcoded generator parameters for each generator type.
# Cost is in thousands, power is in 100MW, CO2 is in tonnes.
gen_types = {
    "G":   {"real_capacity": np.full((TIMESTEP_COUNT), 25.0),
            "reactive_capacity": np.zeros(TIMESTEP_COUNT),
            "real_cost": np.array([2, 0., 0., 2, 15.6, 0]),
            "installation_cost": 2400000,
            "unit_CO2": 49.9,
            "count": 10,
            "per_node_limit": {node:10 for node in range(NODE_COUNT)}},
    "H":   {"real_capacity": np.full((TIMESTEP_COUNT), 12.0),
            "reactive_capacity": np.zeros(TIMESTEP_COUNT),
            "real_cost": np.array([2, 0., 0., 2, 4.3, 0]),
            "installation_cost": 2750000,
            "unit_CO2": 2.6,
            "count": 10,
            "per_node_limit": {0:1, 1:2, 2:0, 3:2, 4:0, 5:1, 6:0, 7:1, 8:2, 9:1}},
    "N":   {"real_capacity": np.full((TIMESTEP_COUNT), 25.0),
            "reactive_capacity": np.zeros(TIMESTEP_COUNT),
            "real_cost": np.array([2, 0., 0., 2, 5.9, 0]),
            "installation_cost": 10000000,
            "unit_CO2": 2.9,
            "count": 10,
            "per_node_limit": {node:10 for node in range(NODE_COUNT)}},
    "S":   {"real_capacity": np.zeros((TIMESTEP_COUNT)),
            "reactive_capacity": np.zeros(TIMESTEP_COUNT),
            "real_cost": np.array([2, 0., 0., 2, 50.4, 0]),
            "installation_cost": 444000,
            "unit_CO2": 8.5,
            "count": 10,
            "per_node_limit": {node:5 for node in range(NODE_COUNT)}},
    "W":   {"real_capacity": np.zeros((TIMESTEP_COUNT)),
            "reactive_capacity": np.zeros(TIMESTEP_COUNT),
            "real_cost": np.array([2, 0., 0., 2, 10.6, 0]),
            "installation_cost": 1600000,
            "unit_CO2": 2.6,
            "count": 10,
            "per_node_limit": {node:10 for node in range(NODE_COUNT)}}
}

solar_wind = np.genfromtxt(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/solar_wind_output.csv"),
    delimiter=',')[TIMESTEP_START:TIMESTEP_START + TIMESTEP_COUNT].astype(int) / 100
gen_types["S"]["real_capacity"] = solar_wind[:, 0] / 2
gen_types["W"]["real_capacity"] = solar_wind[:, 1] / 4
for _, gen_profile in gen_types.items():
    assert (TIMESTEP_COUNT == gen_profile["real_capacity"].shape[0]), "Demand profiles and generation profiles must specify the same number of timesteps"
