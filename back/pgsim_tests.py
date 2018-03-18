import os
import pgsim
import read_pfresults
import eval_pg
import ppc_utils
import ppc_ontario_data
import unittest
import tempfile
import numpy as np

from pypower import case14
from pypower.api import runpf, runopf
from math import radians, sin, cos

import json


class PypowerTestCase(unittest.TestCase):
    def test_runpf_case14(self):
        ppc = case14.case14()
        pf_results, _ = runpf(ppc)
        pf_metrics = read_pfresults.convert_to_metrics(pf_results)

        # Taken from the IEEE 14 case definition; note that there is no expected
        # value for branch data. 
        expected_bus_data = np.array([
                [   1.06      ,    0.        ,  232.39327235,  -16.54930054],
                [   1.045     ,   -4.98258914,   40.        ,   43.55710013],
                [   1.01      ,  -12.72509994,    0.        ,   25.0753485 ],
                [   1.01767085,  -10.31290109,    0.        ,    0.        ],
                [   1.01951386,   -8.7738539 ,    0.        ,    0.        ],
                [   1.07      ,  -14.22094646,    0.        ,   12.7309444 ],
                [   1.06151953,  -13.35962737,    0.        ,    0.        ],
                [   1.09      ,  -13.35962737,    0.        ,   17.62345137],
                [   1.05593172,  -14.9385213 ,    0.        ,    0.        ],
                [   1.05098463,  -15.09728846,    0.        ,    0.        ],
                [   1.05690652,  -14.79062203,    0.        ,    0.        ],
                [   1.05518856,  -15.07558452,    0.        ,    0.        ],
                [   1.05038171,  -15.15627634,    0.        ,    0.        ],
                [   1.03552995,  -16.03364453,    0.        ,    0.        ]
            ])
        assert pf_metrics["passed"]
        assert len(pf_metrics["buses"]) == 14
        for i, node in pf_metrics["buses"].items():
            np.testing.assert_almost_equal(node["generated"]["real"], 
                expected_bus_data[i, 2])
            np.testing.assert_almost_equal(node["generated"]["reactive"], 
                expected_bus_data[i, 3])
    
    def test_runopf_simple(self):
        ppc = {
                "version":  '2', 
                "baseMVA":  100.0,
                "bus":      np.array([
                    [1,  3,  10,    0,   0, 0,  1, 0,    0,    0, 1, 1.0, 0.94],
                    [2,  2,  5,    0,   0, 0,  1, 0,    0,    0, 1, 1.0, 0.94]]),
                "gen":      np.array([[ 2,  0,  0, 15, -15, 1.045, 100, 1, 20,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]),
                "branch":   np.array([[1,   2, 0.01938, 0.05917, 0.0528, 9900, 0, 0, 0,     0, 1, -360, 360]]),
                "gencost":  np.array([[2, 0, 0, 2, 50, 0]])
            }
        pf_results = runopf(ppc)
        pf_metrics = read_pfresults.convert_to_metrics(pf_results)
        print(pf_metrics)

    def test_runopf_simple2(self):
        ppc = {
                "version":  '2', 
                "baseMVA":  100.0,
                "bus":      np.array([
                    [1,  3,  10,    0,   0, 0,  1, 0,    0,    0, 1, 1.06, 0.94],
                    [2,  2,  5,     0,   0, 0,  1, 0,    0,    0, 1, 1.06, 0.94],
                    [3,  2,  20,     0,   0, 0,  1, 0,    0,    0, 1, 1.06, 0.94]]),
                "gen":      np.array([[ 2,  0,  0, 30, -30, 1.045, 100, 1, 40,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]),
                "branch":   np.array([[1,   2, 0.01938, 0.05917, 0.0528, 9900, 0, 0, 0,     0, 1, -360, 360],
                                      [2,   3, 0.01938, 0.05917, 0.0528, 9900, 0, 0, 0,     0, 1, -360, 360]]),
                "gencost":  np.array([[2, 0, 0, 2, 50, 50]])
            }
        pf_results = runopf(ppc)
        pf_metrics = read_pfresults.convert_to_metrics(pf_results)
        print(pf_metrics)

class PgsimutilsTestCase(unittest.TestCase):
    def setUp(self):
        self.gen_placements = [
            {'H': 0, "N": 0, "S": 0, "W": 0},
            {'H': 1, "N": 0, "S": 0, "W": 0},
            {'H': 0, "N": 1, "S": 0, "W": 0},
            {'H': 0, "N": 0, "S": 1, "W": 0},
            {'H': 0, "N": 0, "S": 0, "W": 1},
            {'H': 1, "N": 1, "S": 0, "W": 0},
            {'H': 0, "N": 1, "S": 1, "W": 0},
            {'H': 0, "N": 0, "S": 1, "W": 1},
            {'H': 1, "N": 0, "S": 0, "W": 1},
            {'H': 1, "N": 1, "S": 1, "W": 1}
        ]

    def test_calc_gen_values(self):
        ppc_utils.build_gen_matrices(self.gen_placements, 
            ppc_ontario_data.real_demand_profiles, 
            ppc_ontario_data.gen_types)

    def test_calc_score(self):
        eval_pg.calc_score(self.gen_placements, ppc_ontario_data)

class PgsimSubmitTestCase(unittest.TestCase):

    def setUp(self):
        pgsim.pgsim_app.testing = True
        self.app = pgsim.pgsim_app.test_client()

    def test_submit_empty(self):
        placements = []
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                       content_type='application/json',
                       headers={"team_name": 'Ateam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        print(status)
        assert not status["success"], status['message']
        assert status["message"] == "Please specify at least one hydro or gas generator for PyPower to process successfully."
        
    def test_submit_11_simple(self):
        placements = [{'node': 0, 'generators': {'G':2} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Bteam', "challenge_id": 11})
        status = json.loads(rv.data.decode('unicode_escape'))
        print(status)
        assert status["success"], status['message']
        assert status["eval"]["passed"]

    def test_submit_11_simple2(self):
        placements = [{'node': 0, 'generators': {'H':1} },
                        {'node': 1, 'generators': {'H':1} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Cteam', "challenge_id": 11})
        status = json.loads(rv.data.decode('unicode_escape'))
        print(status)
        assert status["success"], status['message']
        assert status["eval"]["passed"]

    def test_submit_11_simple3(self):
        placements = [{'node': 0, 'generators': {'G':1} },
                        {'node': 1, 'generators': {'H':1} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Dteam', "challenge_id": 11})
        status = json.loads(rv.data.decode('unicode_escape'))
        print(status)
        assert status["success"], status['message']
        assert status["eval"]["passed"]

    def test_submit_simple(self):
        placements = [{'node': 4, 'generators': {'H':1} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Eteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"], status['message']
        assert not status["eval"]["passed"]

    def test_submit_simple2(self):
        placements = [{'node': 0, 'generators': {'G':1} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Fteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"], status['message']
        assert not status["eval"]["passed"]

    def test_submit_simple3(self):
        placements = [{'node': 0, 'generators': {'N':1} }]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Gteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert not status["success"], status['message']
        assert status["message"] == "Please specify at least one hydro or gas generator for PyPower to process successfully."
        
    def test_submit(self):
        placements = [ {"node": 0, "generators": {} }, 
                    {"node": 1, "generators": {'H': 1}},
                    {"node": 2, "generators": {"N": 1}},
                    {"node": 3, "generators": {"G": 1}},
                    {"node": 4, "generators": {"S": 1}},
                    {"node": 5, "generators": {"W": 1}},
                    {"node": 6, "generators": {"H":1, "N": 1}},
                    {"node": 7, "generators": {"G": 1, "S": 1}},
                    {"node": 8, "generators": {"G": 1, "S": 1, "W": 1}},
                    {"node": 9, "generators": {"H": 1, "N":1, "G":1, "S":1, "W":1}}]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Jteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"], status['message']
        assert status["eval"]["passed"]
        print(rv.data)

    def test_submit_ontario(self):
        placements = [ {"node": 0, "generators": {"H": 1, "S": 2} }, 
                       {"node": 1, "generators": {"H": 1, "W": 1}},
                       {"node": 2, "generators": {"N": 2}},
                       {"node": 3, "generators": {"H": 1, "W": 1}},
                       {"node": 4, "generators": {"G": 2}},
                       {"node": 5, "generators": {"H": 1, "W": 1}},
                       {"node": 6, "generators": {"N": 3}},
                       {"node": 7, "generators": {"G": 1, "W": 1}},
                       {"node": 8, "generators": {"H": 2}},
                       {"node": 9, "generators": {"G": 1, "W": 1}}]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Iteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"], status['message']
        assert status["eval"]["passed"]
        print(rv.data)
        #"cost": 8740.259, "installation_cost": 84988000, "CO2": 3891.7800068414053

    def test_submit_ontario_replace_N_with_G(self):
        # Expect lower cost, but higher pollution
        placements = [ {"node": 0, "generators": {"H": 1, "S": 2} }, 
                       {"node": 1, "generators": {"H": 1, "W": 1}},
                       {"node": 2, "generators": {"G": 2}},
                       {"node": 3, "generators": {"H": 1, "W": 1}},
                       {"node": 4, "generators": {"G": 2}},
                       {"node": 5, "generators": {"H": 1, "W": 1}},
                       {"node": 6, "generators": {"G": 3}},
                       {"node": 7, "generators": {"G": 1, "W": 1}},
                       {"node": 8, "generators": {"H": 2}},
                       {"node": 9, "generators": {"G": 1, "W": 1}}]
        rv = self.app.post('/api/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'Jteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"], status['message']
        assert status["eval"]["passed"]
        print(rv.data)
        #"cost": 4315.259, "installation_cost": 46988000, "CO2": 8232.851469618177

class PgsimGetChallengeTestCase(unittest.TestCase):

    def setUp(self):
        pgsim.pgsim_app.testing = True
        self.app = pgsim.pgsim_app.test_client()

    def test_get_challenge_count(self):
        rv = self.app.get('/api/getChallenge/')
        assert json.loads(rv.data.decode('unicode_escape')) == [10, 11]

    def test_get_nonexistent_challenge(self):
        rv = self.app.get('/api/getChallenge/9')
        assert rv.data.decode('unicode_escape') == "The requested challenge doesn't exist."
        
    # Note: Firebase is not completely realtime, so the following cases are assuming
    #       two submissions are in the database. I have left two there untouched.
    def test_get_challenge_latest(self):
        saved_challenge = {'4': {'H':1}}
        rv = self.app.get('/api/getChallenge/10',
                        headers={"team_name": 'ourteam'})
        get_challenge = json.loads(rv.data.decode('unicode_escape'))
        print("getChallenge output:\n{}".format(get_challenge))
        assert len(get_challenge["demands"]) == 10
        # assert get_challenge['saved_challenge'] == saved_challenge

    def test_get_small_challenge(self):
        rv = self.app.get('/api/getChallenge/11',
                        headers={"team_name": 'ourteam'})
        get_challenge = json.loads(rv.data.decode('unicode_escape'))
        assert len(get_challenge["demands"]) == 2
        assert len(get_challenge["lines"]) == 1

    def test_get_leaderboard(self):
        placements = []
        rv = self.app.get('/api/leaderboard/10')
        status = json.loads(rv.data.decode('unicode_escape'))
        print(status)


if __name__ == '__main__':
    unittest.main()