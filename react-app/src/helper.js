
export function debounce(func, wait) {
	var timeout;
	return function() {
		if(timeout){
			clearTimeout(timeout)
		}
		timeout = setTimeout(func,wait)
	};
}

export function makeElement(outerHTML){
	// make an element out of html
	const wrapper = document.createElement('div')
	wrapper.innerHTML = outerHTML
	return wrapper.firstElementChild.cloneNode(true)
}