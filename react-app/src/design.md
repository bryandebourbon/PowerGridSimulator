landing page, separate page: actions: view problem statement and submit button
submission page, actions: submit
leaderboard page, actions: return to submission

# Direct entry by hashtag
- submission: no hashing
- leaderboard: #leaderboard

# Workflow
- mount all component
- relevant components will display themselves according to hash

# Submission (App.jsx)
- Problem statement
    - format: markdown, html, pdf
- submission
    - droppable slots of location
    - inventory of draggable generators
- login for team
    - two text input fields
    - display the submit button only if login success
    - display an error message otherwise
- submit button
    - enter waiting mode
    - upon response, change hash

# Result (Leaderboard.jsx)
- a table of result
- plots of result