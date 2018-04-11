app.directive('loginDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Login.html',
        scope: {
            email: '@',
            password: '@',
        },
        controller: loginDirectiveController
    }
})
var loginDirectiveController = ['$scope', '$rootScope', 'DataService', function ($scope, $rootScope, $DataService) {
    $scope.email = '';
    $scope.password = '';

    $scope.register = function () {
        var user = { email: $scope.email || '', password: $scope.password || '' };

        if (!_.isNull(user.email) && user.email.length < 1) {
            Warning.show('Email field cannot be empty.');

            return;
        }
        if (!_.isNull(user.password) && user.password.length < 5) {
            Warning.show('Password field should be at least 6 characters.');

            return;
        }

        firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
            .then(function (firebaseUser) {
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

                    var teams = firebase.database().ref().child('teams');
                    teams.orderByChild('team_name').equalTo(teamname).once('value', function (team) {
                        var data = team.val();

                        if (data) {
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
                                    $('#team-management-modal').modal('hide');

                                    Spinner.show();

                                    firebaseUser.updateProfile({
                                        displayName: teamname
                                    }).then(function () {

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
                                }
                            })
                        } else {
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

                                    teams.update(newTeam);

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
                Warning.show(error.message);
            })
    }
    $scope.login = function () {
        var user = { email: $scope.email || '', password: $scope.password || '' };

        if (!_.isNull(user.email) && user.email.length < 1) {
            Warning.show('Email field should not be empty.');

            return;
        }
        if (!_.isNull(user.password) && user.password.length < 1) {
            Warning.show('Password field should not be empty.');

            return;
        }

        firebase.auth().signInWithEmailAndPassword(user.email, user.password).then(function (data) {
            var teamname = data.displayName;

            Spinner.show();

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
            Warning.show(error);

            return;
        });
    }

    $scope.copySecretCode = function () {
        var _secretCode = $('#pgs-secret-code');

        _secretCode.select();

        document.execCommand('Copy');
        document.getSelection().removeAllRanges();
    }

    var _teamname = $('#team-name').hide();
}]
