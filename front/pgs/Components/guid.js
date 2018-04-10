/* 
** external: can be triggered from external sources
** internal: only accessible from within the library
*/

/*  
**	tag: external
**	use: generate guid
**	behavior: generate guid
**	input: none
**	output: { @generate }
*/var Guid = (function () {
    /*  
	**	tag: external
	**	use: generate guid
	**	behavior: generate guid
	**	input: none
	**	output: guid
	*/
    var guid = function () {
        var s4 = function () {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    /* functions exposed from Guid library to the external */
    return {
        generate: function () { return guid(); }
    }
})();