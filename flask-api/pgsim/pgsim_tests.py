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
        np.testing.assert_array_almost_equal(pf_metrics["buses"], expected_bus_data)

    def test_runopf(self):
        # TODO: Find a test case for runopf (pending Kevin's input).
        assert True

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

    def test_get_challenge(self):
        rv = self.app.get('/getChallenge/')
        print("getChallenge output:\n{}".format(rv.data))

    def test_submit_empty(self):
        placements = []
        self.assertRaises(AssertionError, self.app.post,'/submit/', data=json.dumps(placements),
                       content_type='application/json', headers={"username": "ourteam"})

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
                       content_type='application/json', headers={"username": "ourteam"})
        print(rv.data)

    #def tearDown(self):
        #os.close(self.db_fd)
        #os.unlink(pgsim.pgsim_app.config['DATABASE'])

if __name__ == '__main__':
    unittest.main()