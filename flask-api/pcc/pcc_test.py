# Test routines for the pcc.py API file.

import pcc
from pcc import pcc_app

def compare_outputs(expected, got):

    print("Expected: {}".format(expected))
    print("Got: {}".format(got))

    if (expected != got):
        print("Not identical. Fail.\n")
        return 0
    else:
        print("Pass.\n")
        return 1


#TODO: declare user_data_found_db statically (not get from db)

def test_check_user():

    tests_passed = 0

    user_data_found_db = pcc.prep.get_team_auth_data()
    test_check_user_cases = [
        {'team_name': 'hello', 'team_key': 'bye', 'expected': '0Error - team does not exist'},
        {'team_name': 'Team 1', 'team_key': 'kEy1', 'expected': '0Error - team does not exist'},
        {'team_name': 'Team Name 91', 'team_key': 'kEy1', 'expected': '0Error - invalid login'},
        {'team_name': 'Team Name 91', 'team_key': 'kEy91', 'expected': '0Error - invalid login'},
        {'team_name': 'Team Name 91', 'team_key': 'kEy61', 'expected': '1Valid'},
        {'team_name': 'Team Name 91', 'team_key': 'kEy62', 'expected': '0Auth failed'}
    ]

    for i in range(len(test_check_user_cases)):
        tests_passed = tests_passed + compare_outputs(
            test_check_user_cases[i]['expected'],
            pcc.auth.check_user(
                test_check_user_cases[i]['team_name'],
                test_check_user_cases[i]['team_key'],
                user_data_found_db
                )
            )

    print('Test auth.check_user results:')
    print('Passed {} of {} test cases.\n'.format(tests_passed, len(test_check_user_cases)))
