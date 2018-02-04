# Authentication functions for PCC web system.
# For users or admins.


# Check user and return the team id.

def get_matching_team_id(team_name, team_key, team_data_found_db):

    # Get ids for given name (could be multiple teams for same name ==> multiple
    # team ids).
    team_names_match_ids = [elem['id'] for elem in team_data_found_db if
        elem['name'] == team_name]

    # Team id appears >= 1 time.
    if len(team_names_match_ids) is 0:
        return None

    # Get id for given key (must be exactly one).
    team_key_match_id = [elem['id'] for elem in team_data_found_db if
        elem['key'] == team_key]

    if not(len(team_key_match_id) is 1):
        return None

    # Check key id matches one of the team name ids.
    if (team_key_match_id[0] in team_names_match_ids):
        return team_key_match_id[0]
    else:
        return None


# Check user authentication by checking a matching id exists for the name and key.
# Return a 1 or 0 to indicate success.

def check_user(team_name, team_key, team_data_found_db):

    # Get ids for given name (could be multiple teams for same name ==> multiple
    # team ids).
    team_names_match_ids = [elem['id'] for elem in team_data_found_db if
        elem['name'] == team_name]

    # Team id appears >= 1 time.
    if len(team_names_match_ids) is 0:
        return "0Team not found."

    # Get id for given key (must be exactly one).
    team_key_match_id = [elem['id'] for elem in team_data_found_db if
        elem['key'] == team_key]

    if not(len(team_key_match_id) is 1):
        return "0Invalid team key."

    # Check key id matches one of the team name ids.
    if (team_key_match_id[0] in team_names_match_ids):
        return "1Valid"
    else:
        return "0Error: authentication failed."
