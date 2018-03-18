import numpy as np, csv, itertools, os, math, copy
from pypower.idx_brch import F_BUS, T_BUS, BR_R, BR_X, BR_B, RATE_A, \
    TAP, SHIFT, BR_STATUS, PF, QF, PT, QT, MU_SF, MU_ST

# NOTE: PYPOWER'S INDEX STARTS FROM 1!

# Hardcoded transmission limits for all lines. The limits are constant over time.
# The lines are designed to connect adjacent Ontario power zones. 
transmission_file = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 
    "data/transmission_lines.csv"), "r")
transmission_reader = csv.reader(transmission_file)
transmission_limits = np.array([np.array(next(transmission_reader)).astype(float)])
transmission_file.close()

# Calculate the r, x, b, and rateA parameters for each line.
distance = 600 * 1.3
line_specs = 243
specs_library = {BR_R: 0.04, BR_X: 0.4, BR_B: 0}
divisor = (line_specs * 1000) ** 2 / transmission_limits[0, RATE_A]
for spec in [BR_R, BR_X, BR_B]:
    transmission_limits[0, spec] = specs_library[spec] * distance / divisor

# Hardcoded demand profiles for each timestep for all the buses. (Number of rows
# == number of timesteps; number of columns == number of buses.)
# TODO: Read a longer time series of the demand profiles.
timestep_start = 45
timestep_count = 1
node_count = 2

demand_file = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 
    "data/zonal_demands.csv"), "r")
demand_reader = csv.reader(demand_file)
real_demand_profiles = np.array([
    timestep[2:4] for timestep in itertools.islice(demand_reader, 
        timestep_start, timestep_start + timestep_count)])
demand_file.close()
real_demand_profiles = real_demand_profiles.astype(int) / 100
reactive_demand_profiles = np.zeros((timestep_count, node_count))

# Specs of buses. Note that the Pd Qd here are dummy values and will be updated
# with the time-dependent values in *_demand_profiles matrices. Vm Va are 
# calculated by runopf().
bus_data = np.array([
    # bus_i type Pd     Qd  Gs Bs area Vm     Va baseKV zone Vmax Vmin
        [1,  3,  0,    0,   0, 0,  1, 1.06,    0,    0, 1, 1.06, 0.94],
        [2,  1, 21.7, 12.7, 0, 0,  1, 1.045,  -4.98, 0, 1, 1.06, 0.94]
    ])
assert node_count == bus_data.shape[0], "Demand profiles and bus data must specify the same number of nodes"

# Hardcoded generator parameters for each generator type over a time series.
# Cost is in thousands, power is in 100MW, CO2 is in tonnes.
# TODO: Consider making the capacity location-dependent; e.g. not all 
# locations can support a lot of hydro generation.
# TODO: Consider making the cost time-dependent; e.g. cheaper to generator at night.
gen_types = {
    "G":   {"real_capacity": np.full((timestep_count), 10.0), 
            "reactive_capacity": np.zeros(timestep_count),
            "real_cost": np.array([2, 0., 0., 2, 15.6, 0]),
            "installation_cost": 2400000,
            "unit_CO2": 49.9, 
            "count": 1,
            "per_node_limit": {node:1 for node in range(node_count)}},
    "H":   {"real_capacity": np.full((timestep_count), 10.0), 
            "reactive_capacity": np.zeros(timestep_count),
            "real_cost": np.array([2, 0., 0., 2, 4.3, 0]),
            "installation_cost": 2750000,
            "unit_CO2": 2.6, 
            "count": 2,
            "per_node_limit": {0:1, 1:1}}, 
    "N":   {"real_capacity": np.full((timestep_count), 25.0), 
            "reactive_capacity": np.zeros(timestep_count),
            "real_cost": np.array([2, 0., 0., 2, 5.9, 0]),
            "installation_cost": 10000000,
            "unit_CO2": 2.9, 
            "count": 0,
            "per_node_limit": {node: 0 for node in range(node_count)}}, 
    "S":   {"real_capacity": np.zeros((timestep_count)), 
            "reactive_capacity": np.zeros(timestep_count),
            "real_cost": np.array([2, 0., 0., 2, 50.4, 0]),
            "installation_cost": 444000,
            "unit_CO2": 8.5, 
            "count": 4,
            "per_node_limit": {node:4 for node in range(node_count)}},
    "W":   {"real_capacity": np.zeros((timestep_count)), 
            "reactive_capacity": np.zeros(timestep_count),
            "real_cost": np.array([2, 0., 0., 2, 10.6, 0]),
            "installation_cost": 1600000,
            "unit_CO2": 2.6, 
            "count": 2,
            "per_node_limit": {node:2 for node in range(node_count)}}
}

solar_wind_file = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 
    "data/solar_wind_output.csv"), "r")
solar_wind_output = csv.reader(solar_wind_file)
solar_wind = np.array([
    timestep for timestep in itertools.islice(solar_wind_output, 
        timestep_start, timestep_start + timestep_count)])
solar_wind_file.close()
solar_wind = solar_wind.astype(int) / 100
gen_types["S"]["real_capacity"] = solar_wind[:, 0]
gen_types["W"]["real_capacity"] = solar_wind[:, 1] / 4

for _, gen_profile in gen_types.items():
    assert (timestep_count == gen_profile["real_capacity"].shape[0]), "Demand profiles and generation profiles must specify the same number of timesteps"
