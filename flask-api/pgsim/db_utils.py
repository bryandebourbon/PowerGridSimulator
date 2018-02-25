import sqlite3
from flask import Blueprint, request, session, g, redirect, url_for, abort, \
     render_template, flash, current_app

# Read in the teams.txt and put the team data into the database. 
def init_db_teams(authfile="pgsim/data/teams.txt"):
    team_info = []
    with open(authfile, 'r') as f:
        contents = list(f)
        for i in range(1, len(contents)):
            team_info.append(contents[i].split('\n')[0].split('\t'))
            team_info[i-1] = {'team_id': i, 'team_key': team_info[i-1][1], 'team_name': team_info[i-1][0]}
    db = get_db()
    for i in range(len(team_info)):
        db.execute('INSERT INTO teams VALUES (?,?,?)', [int(team_info[i]['team_id']), str(team_info[
             i]['team_key']), str(team_info[i]['team_name'])])
    db.commit()

# Initialize the databse using the specified schema, and then put in the teams info. 
def init_db():
    db = get_db()
    with current_app.open_resource('schema.sql', mode='r') as f: # open a resource that the application provides; This function opens a file from the resource location (the flaskr/flaskr folder) and allows you to read from it. It is used in this example to execute a script on the database connection.
        db.cursor().executescript(f.read())
    db.commit()
    init_db_teams()

def connect_db():
    """Connects to the specific database."""
    rv = sqlite3.connect(current_app.config['DATABASE']) # current_app.config['DATABASE']
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    """Opens a new database connection if there is none yet for the
    current application context g.
    """
    if not hasattr(g, 'database'):
        g.database = connect_db()
    return g.database

# TODO: Db functions needed:
# - Query the score entry based on team id
# - Update the database for new score
def get_scores_status_entry(team_id):
    print("Not yet implemented")
    return None

def register_teardowns(current_app):
    @current_app.teardown_appcontext
    def close_db(error):
        """Closes the database again at the end of the request."""
        if hasattr(g, 'database'):
            g.database.close()

def register_cli(current_app):
    # Run "flask initdb" before "flask run" to call this function to initialize the db. 
    @current_app.cli.command('initdb')
    def initdb_command():
        """Creates the database tables."""
        init_db()
        print('Initialized the database.')

# The following functions are example operations that the front-end can call us to do.
# The specific route and methods will be modified later to reflect our frontend's real needs.
# The code will also be modified to work with firebase.
# TODO(Mel) 
def register_routes(current_app):
    '''
    @current_app.route('/')
    def show_entries(): # An example to perform some kind of showing the current db entries
        db = get_db()
        cur = db.execute('select team_key, team_name from teams order by team_id desc')
        entries = cur.fetchall()
        return render_template('show_entries.html', entries=entries)

    @current_app.route('/add', methods=['POST'])
    def add_entry(): # An example to perform some kind of updating the database
        if not session.get('logged_in'):
            abort(401)
        db = get_db()
        db.execute('insert into teams (team_key, team_name) values (?, ?)',
                     [request.form['title'], request.form['text']])
        db.commit()
        flash('New entry was successfully posted')
        return redirect(url_for('show_entries'))

    @current_app.route('/login', methods=['GET', 'POST'])
    def login(): # Perform some kind of logging in 
        error = None
        if request.method == 'POST':
            # Or query our team info database :) 
            if request.form['username'] != current_app.config['USERNAME']:
                error = 'Invalid username'
            elif request.form['password'] != current_app.config['PASSWORD']:
                error = 'Invalid password'
            else:
                session['logged_in'] = True
                flash('You were logged in')
                return redirect(url_for('show_entries'))
        return render_template('login.html', error=error)

    @current_app.route('/logout') # Perform logging out 
    def logout():
        session.pop('logged_in', None)
        flash('You were logged out')
        return redirect(url_for('show_entries'))
    '''
    return 

