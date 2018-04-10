var Warning = (function () {
    var showWarning = function (message) {
        var _alert = $('.pgs-alert');
        var _alertMessage = _alert.find('.pgs-alert-content');

        _alertMessage.text(message);

        _alert.show();

        _.delay(function () { hideWarning(); }, 3000);
    }
    var hideWarning = function () {
        var _alert = $('.pgs-alert');
        var _alertMessage = _alert.find('.pgs-alert-content');

        _alertMessage.text();

        _alert.hide();
    }

    return {
        show: function (message) { return showWarning(message); },
        hide: function () { return hideWarning(); }
    }
})();