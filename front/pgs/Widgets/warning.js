/* 
** external: can be triggered from external sources
** internal: only accessible from within the library
*/

/*  
**	tag: external
**	use: show or hide spinner at page transition
**	behavior: control spinner behavior
**	input: none
**	output: { @show, @hide }
*/
var Warning = (function () {
    /*  
	**	tag: external
	**	use: raise errors
	**	behavior: show warning
	**	input: message = ''
	**	output: none
	*/
    var showWarning = function (message) {
        var _alert = $('.pgs-warning');
        var _alertMessage = _alert.find('.pgs-warning-content');

        _alertMessage.text(message);

        _alert.show();

        _.delay(function () { hideWarning(); }, 3000);
    }
    /*  
	**	tag: external
	**	use: stop raising errors
	**	behavior: hide warning
	**	input: none
	**	output: none
	*/
    var hideWarning = function () {
        var _alert = $('.pgs-warning');
        var _alertMessage = _alert.find('.pgs-warning-content');

        _alertMessage.text();

        _alert.hide();
    }

    /* functions exposed from Warning component to the external */
    return {
        show: function (message) { return showWarning(message); },
        hide: function () { return hideWarning(); }
    }
})();