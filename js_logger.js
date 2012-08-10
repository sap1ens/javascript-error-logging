/**
 * Logging function that will trap javascript errors and report them
 * 
 * @author sap1ens https://github.com/sap1ens/javascript-error-logging (fork from https://github.com/robby1066/javascript-error-logging)
 * @dependency JSON.stringify() // IE8+
 */
var js_logger = (function() {

	var track_event_url = 'index.html',
		is_loaded = false, // flag to let us know it's safe to log errors.
		errors = [],
  		error_count = 0,
  		max_errors = 10; // prevent runaway logging for infinite loops
  		
  	function logError(msg, url, line) {
	  	// save the errors to an array, this will be emptied out when the page is fully loaded.
		if (typeof msg !== "undefined" && error_count < max_errors) {
			error_count++;
			
			// use current URL by default
			if(!url) url = location.href;
			
			var track_error = {
				message: msg,
				url: url,
				line: line,
				userAgent: navigator.userAgent,
				time: (new Date()).getTime()
			};
			
			errors.push(track_error);
			
			if(typeof console !== "undefined") {
				console.log("Logger saved: " + msg);
			}
			
			if (is_loaded == true) {
				reportErrors();
			}
		}
  	}
  
	var xmlVersions = [
		"Msxml2.XMLHTTP.6.0",
		"MSXML2.XMLHTTP.3.0",
		"MSXML2.XMLHTTP",
		"Microsoft.XMLHTTP"
	];
	
	if(typeof XMLHttpRequest == "undefined") XMLHttpRequest = function() {
		for(var i in xmlVersions) {
			try { return new ActiveXObject(xmlVersions[i]); }
			catch(e) {}
		}
	};  	
  	
	function reportErrors() {
		if(errors.length > 0) {
			var params = '{"loggedErrors":' + JSON.stringify(errors) + '}';
			
			var req =  new XMLHttpRequest();
			req.open('POST', track_event_url, true)
			req.setRequestHeader("Content-Type", "application/json");
			req.send(params); 
			
			errors = [];
			error_count = 0;
		}
	}

	/**
	 * RequireJS support
	 */
	function setRequireJSErrorHandling() {
		if(typeof require !== "undefined" && require.onError) {
			require.onError = function(msg) { 
				
				// if object
				if(msg === Object(msg) && msg.requireType && msg.requireModules) {
					msg = "requireType: " + msg.requireType + ", requireModules: " + msg.requireModules;
				} 
				
				logError(msg, "", 0);
			};
		}			
	}
	
	/**
	 * Cross-browser support of onDOMContentLoaded event
	 * 
	 * http://javascript.ru/tutorial/events/ondomcontentloaded
	 */
	function onReady(handler) {
		var called = false;
	
		function ready() {
			if (called) return;
			called = true;
			handler();
		}
	
		if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", function() {
				ready();
			}, false)
		} else if (document.attachEvent) {
			if (document.documentElement.doScroll && window == window.top) {
				function tryScroll() {
					if (called) return;
					if (!document.body) return;
					try {
						document.documentElement.doScroll("left");
						ready();
					} catch(e) {
						setTimeout(tryScroll, 0);
					}
				}
				tryScroll();
			}
	
			document.attachEvent("onreadystatechange", function() {
				if (document.readyState === "complete") {
					ready();
				}
			});
		}
	
		if (window.addEventListener) {
			window.addEventListener('load', ready, false);
		} else if (window.attachEvent) {
			window.attachEvent('onload', ready);
		}   
	}
	
	return {
		init: function() {
			var loaded = function() {
				setRequireJSErrorHandling();		
				
				is_loaded = true;   
				reportErrors();  
			};
			
			onReady(loaded);
	        
			window.onerror = function(msg, url, line) { 
				logError(msg, url, line); 
				
				// change to the "true" for suppressing error
				return false; 
			};
		},
		report: function(msg, url, line) {
			logError(msg, url, line); 
		}
	};  
})();

js_logger.init();