app.directive('challengesDirective', function () {
    return {
        restrict: 'EA',
        templateUrl: './Partials/_Challenges.html',
        scope: {
            challenges: '=?'
        },
        controller: challengesDirectiveController
    }
})
var challengesDirectiveController = ['$scope', '$rootScope', '$timeout', 'DataService', function ($scope, $rootScope, $timeout, $DataService) {
    $scope.previewChallenge = function (id) {
        var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

        if (challenge) {
            var _previewModalTitle = $('.modal-title');
            var _previewModalDescription = $('.modal-description');

            _previewModalTitle.text(challenge.name);
            _previewModalDescription.text(challenge.description);
        }
    }
    $scope.simulateChallenge = function (id) {
        var challenge = _.find($scope.challenges, function (c) { return c.id == id; });

        if (challenge) {
            $DataService.getChallenge({ teamname: $.cookie('teamname'), challengeID: id })
                .then(function (data) {
                    Spinner.hide();

                    $rootScope.$broadcast('pgsStateChanged', { state: 'grid', challenge: data });
                }).catch(function (error) {
                    Spinner.hide();

                    Warning.show(error);
                })
        }
    }

    $scope.goBack = function () {
        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
    }
    $scope.logOut = function () {
        $timeout(function () { $rootScope.$broadcast('pgsStateChanged', { state: 'login' }); });
    }
}]