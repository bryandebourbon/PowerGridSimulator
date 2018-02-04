# Database functions for PCC web system.


import sqlite3
from flask import g  # Flask application context

from pcc import pcc_app


# Connect to the database.

def connect_db():
    db = g._database = sqlite3.connect(pcc_app.config['DATABASE'])
    db.row_factory = sqlite3.Row
    return db


# Get cursor to database.

def get_db():

    # Get attribute _database of application context g. Return None if
    # not exist.
    db = getattr(g, '_database', None)

    # If db not found in g, open a new connection.
    if db is None:
        db = connect_db()

    return db


# Initialize a new database from a given schema.

def init_db(schema, app):
    with app.app_context():
        db = get_db()
        with app.open_resource(schema, mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


# Query the database with an SQL command.

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv


# Save the database (commit to the .db file).

def save_db():
    get_db().commit()

def print_entire_db():
    for r in query_db('SELECT * FROM teams'):
        print(tuple(r))

    for r in query_db('SELECT * FROM submissions'):
        print(tuple(r))

    for r in query_db('SELECT * FROM scores'):
        print(tuple(r))
