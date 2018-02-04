DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS scores;
DROP VIEW IF EXISTS view_team_auth;
DROP VIEW IF EXISTS view_submit_ids;

CREATE TABLE teams(
  team_id INTEGER PRIMARY KEY,
  team_key TEXT,
  team_name TEXT
);

CREATE TABLE submissions(
  submit_id INTEGER PRIMARY KEY,
  date_time TEXT,
  team_id INTEGER,
  submission TEXT,

  score_efficiency REAL,
  score_cost REAL,
  score_CO2 REAL,
  score_constraints REAL,
  overall_score REAL,
  pass_fail NUMERIC,

  FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

/* Scores to track the best submission and number of attempts for each team.*/
/* Must be initialized with attempts = 0.*/

CREATE TABLE scores(
  team_id INTEGER,
  submit_id_best INTEGER,
  num_attempts INTEGER, -- Initialized to zero at beginning ("attempts made so far").

  score_efficiency REAL,
  score_cost REAL,
  score_CO2 REAL,
  score_constraints REAL,
  overall_score REAL,
  pass_fail NUMERIC,

  FOREIGN KEY (team_id) REFERENCES teams(team_id),
  FOREIGN KEY (submit_id_best) REFERENCES submissions(submit_id)
);

CREATE VIEW view_team_auth AS
SELECT team_id, team_key, team_name FROM teams;

CREATE VIEW view_submit_ids AS
SELECT submit_id FROM submissions;

/* Note: WHERE clauses must have arguments passed as strings (integers don't work).
