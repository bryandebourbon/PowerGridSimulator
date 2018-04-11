app.directive('challengeDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Challenge.html',
        scope: {
            challenge: '=?'
        },
        controller: challengeDirectiveController
    }
})
var challengeDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
    $scope.tab = 'simulation';

    $scope.switchTab = function (evt) {
        if (evt && evt.currentTarget) {
            $scope.tab = evt.currentTarget.dataset.tab;

            $(evt.currentTarget).addClass('active');
            $(evt.currentTarget).siblings().removeClass('active');
        }
    }

    $scope.submitChallenge = function () {
        Spinner.show();

        $DataService.submitChallenge({ challenge: $scope.challenge, teamname: $.cookie('teamname'), challengeID: 10 })
            .then(function (data) {
                Spinner.hide();

                if (data.success) {
                    $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'evaluation', evaluation: data.eval }); });
                } else {
                    Warning.show(data.message);
                }
            }).catch(function (error) {
                console.log(error);
            })
    }

    $scope.viewLeaderBoard = function () {
        Spinner.show();

        $DataService.getLeaderBoard({ teamname: $.cookie('teamname'), challengeID: $scope.challenge.id })
            .then(function (data) {
                Spinner.hide();

                $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'leaderboard', challenge: $scope.challenge, leaderboard: data, teamname: $.cookie('teamname') || '' }); });
            }).catch(function (error) {
                console.log(error);
            })
    }

    $scope.goBack = function () {
        Spinner.show();

        $DataService.getChallenges({ teamname: $.cookie('teamname') })
            .then(function (data) {
                Spinner.hide();

                $rootScope.$broadcast('pgsStateChanged', { state: 'challenges', challenges: data });
            }).catch(function (error) {
                console.log(error);
            })
    }
    $scope.logOut = function () {
        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
    }
}]