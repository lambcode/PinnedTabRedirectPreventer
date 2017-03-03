'use strict';

function getActiveTab(next) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        return next(null, tabs && tabs[0] ? tabs[0] : null);
    });
};

function openLink(info, from, next) {
    
	getActiveTab(function(err, activeTab) {
		
		var defaults = {
			createdTabIds: {
			}
		};

		chrome.storage.sync.get(defaults, function(lastInfo) {
			
			getRightMostExistingTabIndex(activeTab.index, lastInfo.createdTabIds[activeTab.windowId], function(rightMostIndex) {
				
				chrome.tabs.create({
					url: info.url,
					active: false,
					index: rightMostIndex + 1
				}, function(createdTab) {
					if (!lastInfo.createdTabIds[activeTab.windowId])
						lastInfo.createdTabIds[activeTab.windowId] = []
					lastInfo.createdTabIds[activeTab.windowId].push(createdTab.id);
					chrome.storage.sync.set({
						createdTabIds: lastInfo.createdTabIds
					});

				});
				
			});
		});
	
	});

    return true;
};

function getRightMostExistingTabIndex(biggestIndex, tabIdListRemaining, next) {
	if (!tabIdListRemaining || tabIdListRemaining.length == 0)
	{
		next(biggestIndex);
		return;
	}

	var tabId = tabIdListRemaining[0];
	var remaining = tabIdListRemaining.slice(1);
	
	chrome.tabs.get(tabId, function(tab) {
		getRightMostExistingTabIndex(tab.index > biggestIndex ? tab.index : biggestIndex, remaining, next)
	});
}

function superHandler(info, from, next) {
	if (info.key === 'click')
		return openLink(info, from, next);
	else
		next(from.tab ? from.tab.pinned : false);
	return true;
}

function setActiveTabAndWindow(activeTabish) {
	chrome.tabs.get(activeTabish.tabId, function(activeTab) {
		chrome.storage.sync.set({
			createdTabIds: {
				[activeTab.windowId]: []
			}
		});
	})
    
};

function storageMaintenance(tabId, info) {
	var defaults = {
		createdTabIds: {
		}
	};

	chrome.storage.sync.get(defaults, function(lastInfo) {
		for (var w in lastInfo.createdTabIds) {
			lastInfo.createdTabIds[w] = lastInfo.createdTabIds[w].filter(function(tId) {
				return tId != tabId;
			})
		}
		
		chrome.storage.sync.set(lastInfo);
	});
}

chrome.runtime.onMessage.addListener(superHandler);
chrome.tabs.onActivated.addListener(setActiveTabAndWindow)
chrome.tabs.onRemoved.addListener(storageMaintenance)
