app.directive('loginDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Login.html',
        scope: {
            email: '@',
            password: '@',
        },
        controller: ['$scope', '$rootScope', 'DataService', function($scope, $rootScope, $DataService) {
            /* clear scope variables */
            $scope.email = '';
            $scope.password = '';

            /*  
            **	use: register new user (to a new team or to an existing team)
            **	behavior: check user information, register and bring to challenges view if information valid
            **	input: none
            **	output: none
            */
            $scope.register = function () {
                /* basic checking for input minimum length requirement */
                var user = { email: $scope.email || '', password: $scope.password || '' };

                if (!_.isNull(user.email) && user.email.length < 1) {
                    Warning.show('Email field cannot be empty.');

                    return;
                }
                if (!_.isNull(user.password) && user.password.length < 5) {
                    Warning.show('Password field should be at least 6 characters.');

                    return;
                }

                /* create user with firebase */
                firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
                    .then(function (firebaseUser) {
                        /* case 1: success - ask for team name for registration */
                        var _teamManagementModal = $('#team-management-modal');
                        var _collectTeamname = $('#collect-team-name');

                        var _collectTeamSecretCode = $('#collect-team-secret-code');
                        var _distributeTeamSecretCode = $('#distribute-team-secret-code');

                        var _teamnameInput = $('#team-name-input');
                        var _secretCodeInput = $('#secret-code-input');

                        var _submitTeamname = $('#submit-team-name');
                        var _submitSecretCode = $('#submit-secret-code');

                        _collectTeamname.show();
                        _collectTeamSecretCode.hide();
                        _distributeTeamSecretCode.hide();

                        _submitTeamname.show();
                        _submitSecretCode.hide();

                        _teamnameInput.val('');
                        _secretCodeInput.val('');

                        _teamManagementModal.modal('show');
                        _submitTeamname.on('click', function (evt) {
                            var teamname = _teamnameInput.val();

                            /* check if team name already in database */
                            var teams = firebase.database().ref().child('teams');
                            teams.orderByChild('team_name').equalTo(teamname).once('value', function (team) {
                                var data = team.val();

                                if (data) {
                                    /* sub-case 1: team name already in database - ask for team secret code */
                                    _collectTeamname.hide();
                                    _collectTeamSecretCode.show();

                                    _submitTeamname.hide();
                                    _submitSecretCode.show();

                                    _teamnameInput.val('');
                                    _secretCodeInput.val('');

                                    var secretCode = _.keys(data)[0];

                                    _submitSecretCode.on('click', function (evt) {
                                        var inputCode = _secretCodeInput.val();

                                        if (inputCode == secretCode) {
                                            /* sub-sub-case 1: team secret code match our record - proceed to challenges view */
                                            $('#team-management-modal').modal('hide');

                                            Spinner.show();

                                            /* add user to team in database */
                                            firebaseUser.updateProfile({
                                                displayName: teamname
                                            }).then(function () {
                                                /* bring to challenges view */
                                                $DataService.getChallenges({ teamname: teamname })
                                                    .then(function (data) {
                                                        Spinner.hide();

                                                        $.cookie('teamname', teamname);
                                                        $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
                                                    }).catch(function (error) {
                                                        Spinner.hide();

                                                        Warning.show(error);
                                                    })
                                            }).catch(function (error) {
                                                Spinner.hide();

                                                Warning.show(error.message);
                                            })
                                        } else {
                                            /* sub-sub-case 2: team secret code does not match our record - remain in current page */
                                            Warning.show('Team secret code incorret, please re-enter');
                                        }
                                    })
                                } else {
                                    /* sub-case 2: team name new to database - distribute team secret code */
                                    var secretCode = teams.push().key;

                                    var _secretCode = $('.pgs-secret-code');

                                    _collectTeamname.hide();
                                    _distributeTeamSecretCode.show();

                                    _submitTeamname.hide();
                                    _submitSecretCode.hide();

                                    _teamnameInput.val('');
                                    _secretCodeInput.val('');
                                    _secretCode.val(secretCode);

                                    _teamManagementModal.on('hide.bs.modal', function (evt) {
                                        Spinner.show();

                                        teams.orderByChild('team_id').limitToLast(1).once('value', function (teamData) {
                                            var teamID = _.head(_.values(teamData.val())).team_id + 1;

                                            var newTeam = {};
                                            newTeam[secretCode] = { team_id: teamID, team_name: teamname };

                                            /* update team information in database */
                                            teams.update(newTeam);

                                            /* bring to challenges view */
                                            $DataService.getChallenges({ teamname: teamname })
                                                .then(function (data) {
                                                    Spinner.hide();

                                                    $.cookie('teamname', teamname);
                                                    $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
                                                }).catch(function (error) {
                                                    Spinner.hide();

                                                    Warning.show(error);
                                                })
                                        }).catch(function (error) {
                                            Spinner.hide();

                                            Warning.show(error);
                                        })
                                    })
                                }
                            })
                        })
                    }).catch(function (error) {
                        /* case 2: failure (due to existing user registering) - remain in current page */
                        Warning.show(error.message);
                    })
            }
            /*  
            **	use: log in existing user
            **	behavior: check user information, log in and bring to challenges view if information valid
            **	input: args = { teamname }
            **	output: promise -> challenges = [{ id, name, saved, description }]
            */
            $scope.login = function () {
                /* basic checking for input minimum length requirement */
                var user = { email: $scope.email || '', password: $scope.password || '' };

                if (!_.isNull(user.email) && user.email.length < 1) {
                    Warning.show('Email field should not be empty.');

                    return;
                }
                if (!_.isNull(user.password) && user.password.length < 1) {
                    Warning.show('Password field should not be empty.');

                    return;
                }

                /* sign in with firebase */
                firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(function (data) {
                    /* case 1: success - proceed to challenges view */
                    var teamname = data.displayName;

                    Spinner.show();

                    /* retrieve and bring to challenges view */
                    $DataService.getChallenges({ teamname: data.displayName })
                        .then(function (data) {
                            Spinner.hide();

                            $.cookie('teamname', teamname);
                            $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
                        }).catch(function (error) {
                            Spinner.hide();

                            Warning.show(error);
                        })
                }).catch(function (error) {
                    /* case 2: failure - remain in current page */
                    Warning.show(error);

                    return;
                });
            }

            /*  
            **	use: copy secret code when clicking "copy" button
            **	behavior: copy secret code to clip board
            **	input: none
            **	output: none
            */
            $scope.copySecretCode = function () {
                var _secretCode = $('#pgs-secret-code');

                _secretCode.select();

                document.execCommand('Copy');
                document.getSelection().removeAllRanges();
            }
        }]
    }
})