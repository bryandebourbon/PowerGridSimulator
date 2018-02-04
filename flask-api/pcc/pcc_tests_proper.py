# Test script using unittest package.
# To run, type 'python pcc_tests_proper.py' in terminal.


import os
import pcc
import unittest
import tempfile

from pcc import SCHEMA

class PccTestCase(unittest.TestCase):

    def setUp(self):
        self.db_fd, pcc.pcc_app.config['DATABASE'] = tempfile.mkstemp() # return low-level file handle and random file name
        pcc.pcc_app.testing = True
        self.app = pcc.pcc_app.test_client()
        with pcc.pcc_app.app_context():
            pcc.dbfunc.init_db(SCHEMA, pcc.pcc_app)

    def tearDown(self):
        os.close(self.db_fd)
        os.unlink(pcc.pcc_app.config['DATABASE'])

    def test_root_message(self):
        rv = self.app.get('/')
        assert b'This is the Power Case Competition API which React calls.' in rv.data

if __name__ == '__main__':
    unittest.main()
