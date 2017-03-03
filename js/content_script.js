'use strict';

/**
 * Content script injected into all pages
 * Sets up a DOM Mutation Observer which looks for 
 * 'a' tags and adds a click handler to them
 */
(function() {
    var mouseDownPos;
    var mouseDownTimer;
    var forceLeftClickSameTab;
	var pinnedTab = false;

    function setupMutationHelpers(onClick) {
        function mutationChecker(nodeList) {
            Array.prototype.forEach.call(nodeList, function(node) {
                if (node instanceof window.HTMLAnchorElement) {
                    node.addEventListener('click', onClick);
                }

                if (node.childNodes && node.childNodes.length)
                    mutationChecker(node.childNodes);
            });
        }

        let observer = new MutationObserver(function(records) {
            records.forEach(function(record) {
                mutationChecker(record.addedNodes);
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    };

    function onClick(ev) {
        if (ev.altKey || ev.shiftKey || ev.ctrlKey)
            return;

        var clickedButton = ['left', 'middle', 'right'][ev.button];
        if (clickedButton !== 'left') 
            return;

        if (!(ev.currentTarget && ev.currentTarget.href))
            return;
		
		if (!pinnedTab) 
            return

        ev.preventDefault();

        chrome.runtime.sendMessage({
			key: 'click',
            url: ev.currentTarget.href
        });
    };
	
	chrome.runtime.sendMessage({
		key: 'isPinned'
    }, function(answer) {
		pinnedTab = answer
	});
    setupMutationHelpers(onClick);
})();
