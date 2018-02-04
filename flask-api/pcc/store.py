# Store data in the database for PCC web system.
# Also includes any update functions, for now.

import dbfunc


# Increment num_attempts for a given team score.

def increment_score_attempt(team_id, current_attempts):

    dbfunc.query_db('UPDATE scores SET num_attempts=? WHERE team_id=?', (current_attempts + 1, str(team_id)))

    dbfunc.save_db()

    success = 1
    return success

# Update scores in table.

def update_scores_entry(new_scores_entry):

    dbfunc.query_db(
        'UPDATE scores SET submit_id_best=?, \
            num_attempts=?, score_efficiency=?, score_cost=?, score_CO2=?, \
            score_constraints=?, overall_score=?, pass_fail=? WHERE team_id=?',
        (new_scores_entry['submit_id_best'],
        new_scores_entry['num_attempts'],
        new_scores_entry['score_efficiency'],
        new_scores_entry['score_cost'],
        new_scores_entry['score_CO2'],
        new_scores_entry['score_constraints'],
        new_scores_entry['overall_score'],
        new_scores_entry['pass_fail'],
        str(new_scores_entry['team_id']))
    )

    dbfunc.save_db()

    success = 1

    return success


def insert_submission_entry(entry):

    # Should try querying the entry data from the db once inserted, to check.
    success = 1

    #try:
    dbfunc.query_db(
        'INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?,?,?)',
        (int(entry['submit_id']),
        entry['date_time'],
        int(entry['team_id']),
        entry['submission'],
        entry['score_efficiency'],
        entry['score_cost'],
        entry['score_CO2'],
        entry['score_constraints'],
        entry['overall_score'],
        entry['pass_fail'])
    )
    #except:
    #    success = None

    dbfunc.save_db()

    return success

# Populate database, given lists of data.

def populate_db(team_data, submission_data, scores_data):

    for i in range(len(team_data)):
        dbfunc.query_db('INSERT INTO teams VALUES (?,?,?)', (team_data[i]['team_id'], team_data[
             i]['team_key'], team_data[i]['team_name']))

    for i in range(len(submission_data)):
        dbfunc.query_db(
            'INSERT INTO submissions VALUES (?,?,?,?,?,?,?,?,?,?)',
            (submission_data[i]['submit_id'],
            submission_data[i]['date_time'],
            submission_data[i]['team_id'],
            submission_data[i]['submission'],
            submission_data[i]['score_efficiency'],
            submission_data[i]['score_cost'],
            submission_data[i]['score_CO2'],
            submission_data[i]['score_constraints'],
            submission_data[i]['overall_score'],
            submission_data[i]['pass_fail'])
        )

    for i in range(len(scores_data)):
        dbfunc.query_db(
            'INSERT INTO scores VALUES (?,?,?,?,?,?,?,?,?)',
            (scores_data[i]['team_id'],
            scores_data[i]['submit_id_latest'],
            scores_data[i]['num_attempts'],
            scores_data[i]['score_efficiency'],
            scores_data[i]['score_cost'],
            scores_data[i]['score_CO2'],
            scores_data[i]['score_constraints'],
            scores_data[i]['overall_score'],
            scores_data[i]['pass_fail'])
        )

    dbfunc.save_db()
