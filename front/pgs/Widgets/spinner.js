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
var Spinner = (function () {
    /*  
	**	tag: external
	**	use: show spinner on page transition data loading
	**	behavior: show spinner
	**	input: none
	**	output: none
	*/
    var showSpinner = function () {
        $('#pgs-app').addClass('pgs-dim');

        $('.pgs-spinner').show();
    }
    /*  
	**	tag: external
	**	use: hide spinner on page transition data loading finished
	**	behavior: hide spinner
	**	input: none
	**	output: none
	*/
    var hideSpinner = function () {
        $('#pgs-app').removeClass('pgs-dim');

        $('.pgs-spinner').hide();
    }

   	/* functions exposed from Spinner component to the external */
    return {
        show: function () { return showSpinner(); },
        hide: function () { return hideSpinner(); }
    }
})();