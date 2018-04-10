var Spinner = (function () {
    var showSpinner = function () {
        $('#pgs-app').addClass('pgs-dim');

        $('.pgs-spinner').show();
    }
    var hideSpinner = function () {
        $('#pgs-app').removeClass('pgs-dim');

        $('.pgs-spinner').hide();
    }

    return {
        show: function () { return showSpinner(); },
        hide: function () { return hideSpinner(); }
    }
})();