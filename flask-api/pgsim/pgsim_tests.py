import os
import pgsim
import read_pfresults
import eval_pg
import ppc_utils
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
            np.testing.assert_almost_equal(node["supplied"]["real"], 
                expected_bus_data[i, 0]*cos(radians(expected_bus_data[i, 1])))
            np.testing.assert_almost_equal(node["supplied"]["reactive"], 
                expected_bus_data[i, 0]*sin(radians(expected_bus_data[i, 1])))

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
        ppc_utils.build_gen_matrices(self.gen_placements)

    def test_calc_score(self):
        eval_pg.calc_score(self.gen_placements)

class PgsimTestCase(unittest.TestCase):

    def setUp(self):
        #self.db_fd, pgsim.pgsim_app.config['DATABASE'] = tempfile.mkstemp()
        pgsim.pgsim_app.testing = True
        self.app = pgsim.pgsim_app.test_client()
        #with pgsim.pgsim_app.app_context():
        #    pgsim.db_utils.init_db()

    def test_submit_empty(self):
        placements = []
        rv = self.app.post('/submit/', data=json.dumps(placements),
                       content_type='application/json',
                       headers={"team_name": 'ourteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert not status["success"]
        assert status["message"] == "Please specify at least one generator."
        
    def test_submit_simple(self):
        placements = [{'node': 4, 'generators': {'H':1} }]
        rv = self.app.post('/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'ourteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"]
        assert not status["eval"]["passed"]

    def test_submit_simple2(self):
        placements = [{'node': 0, 'generators': {'G':1} }]
        rv = self.app.post('/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'ourteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"]
        assert not status["eval"]["passed"]

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
        rv = self.app.post('/submit/', data=json.dumps(placements),
                            content_type='application/json',
                            headers={"team_name": 'ourteam', "challenge_id": 10})
        status = json.loads(rv.data.decode('unicode_escape'))
        assert status["success"]
        assert status["eval"]["passed"]
        print(rv.data)

    # Note: Firebase is not completely realtime, so the following cases are assuming
    #       two submissions are in the database. I have left two there untouched.
    def test_get_challenge_simple(self):
        saved_challenge = {'4': {'H':1}}
        rv = self.app.get('/getChallenge/',
                        headers={"team_name": 'ourteam', "challenge_id": 10})
        get_challenge = json.loads(rv.data.decode('unicode_escape'))
        # print("getChallenge output:\n{}".format(get_challenge))
        assert get_challenge['saved_challenge'] == saved_challenge

    def test_get_challenge_latest(self):
        saved_challenge = {'4': {'H':1}}
        rv = self.app.get('/getChallenge/',
                        headers={"team_name": 'ourteam', "challenge_id": 10})
        get_challenge = json.loads(rv.data.decode('unicode_escape'))
        print("getChallenge output:\n{}".format(get_challenge))
        assert get_challenge['saved_challenge'] == saved_challenge

    #def tearDown(self):
        #os.close(self.db_fd)
        #os.unlink(pgsim.pgsim_app.config['DATABASE'])

if __name__ == '__main__':
    unittest.main()