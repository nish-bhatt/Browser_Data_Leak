function uniqid(prefix, more_entropy) {
  //  discuss at: http://phpjs.org/functions/uniqid/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  revised by: Kankrelune (http://www.webfaktory.info/)
  //        note: Uses an internal counter (in php_js global) to avoid collision
  //        test: skip
  //   example 1: uniqid();
  //   returns 1: 'a30285b160c14'
  //   example 2: uniqid('foo');
  //   returns 2: 'fooa30285b1cd361'
  //   example 3: uniqid('bar', true);
  //   returns 3: 'bara20285b23dfd1.31879087'

  if (typeof prefix === 'undefined') {
    prefix = '';
  }

  var retId;
  var formatSeed = function(seed, reqWidth) {
    seed = parseInt(seed, 10)
      .toString(16); // to hex str
    if (reqWidth < seed.length) { // so long we split
      return seed.slice(seed.length - reqWidth);
    }
    if (reqWidth > seed.length) { // so short we pad
      return Array(1 + (reqWidth - seed.length))
        .join('0') + seed;
    }
    return seed;
  };

  // BEGIN REDUNDANT
  if (!this.php_js) {
    this.php_js = {};
  }
  // END REDUNDANT
  if (!this.php_js.uniqidSeed) { // init seed with big random int
    this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
  }
  this.php_js.uniqidSeed++;

  retId = prefix; // start with prefix, add current milliseconds hex string
  retId += formatSeed(parseInt(new Date()
    .getTime() / 1000, 10), 8);
  retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
  if (more_entropy) {
    // for more entropy we add a float lower to 10
    retId += (Math.random() * 10)
      .toFixed(8)
      .toString();
  }

  return retId;
}

/**
 * Add escapeXml function to all Strings. This function will escape / transform special XML characters.
 * '&' => '&amp;'
 * '<' => '&lt;'
 * '>' => '&gt;'
 * '"' => '&quot;'
 *
 * See also: http://stackoverflow.com/questions/7918868/how-to-escape-xml-entities-in-javascript
 */
if (!String.prototype.escapeXml) {
	String.prototype.escapeXml = function () {
    	return this.replace(/&/g, '&amp;')
        	       .replace(/</g, '&lt;')
        	       .replace(/>/g, '&gt;')
        	       .replace(/"/g, '&quot;');
    }
}


/**
 * Add lpad function to all Strings. This function will add a padding string left to a given string.
 * Example: ("000").toString().lpad("1", 6) => "111000"
 *
 * @param string pad String to be attached preceding the given string.
 * @param number length Length of the string with padding.
 * @return string New string with length of <length> with preceding (repeated) <pad>.
 */
if (!String.prototype.lpad) {
	String.prototype.lpad = function(pad, length) {
		var s = this;
		while (s.length < length)
        	s = pad + s;
        return s;
    }
}

/**
 * Internet Explorer does not have a console object if developer tools are not installed.
 * In this case, add a dummy object 'console' with an empty function 'log'.
 * This will prevent raising errors when calling console.log().
 */
if (!window.console)
	console = {log: function() {}};
	
/**
 * "Constants"
 */

/** @const DEBUG_MODE Write debug information to console.log if 'true'. */	
var DEBUG_MODE = true;

/** @const FLASH_PATH Path to SWF-file that lists all installed fonts. */
var FLASH_PATH = 'swf/bfp.swf';

/** @const DTD_URL Link to XML Document Type Definition */
var DTD_URL = 'http://bfp.henning-tillmann.de/bfp.dtd';

/** @const AJAX_PHP PHP file that processes sent XML data. */
var AJAX_PHP = 'ajax.php';

/** @const PNG_PHP PHP file that creates a 2x1 PNG image. */
var PNG_PHP = 'png.php';

/** @const COOKIE_EXPIRE_PAST Date in the past to delete a cookie. */
var COOKIE_EXPIRE_PAST = 'Sun, 30 Sep 2012 00:00:00 GMT';

/** @const COOKIE_EXPIRE_FUTURE Date in the future. When should the cookie expire? */
var COOKIE_EXPIRE_FUTURE = 'Sat, 03 Jan 2015 12:00:00 GMT';


var http = new Array(1);							/** Browser http Objects ([0] is used for main fingerprinting, [1] for sending font list). */

var fonts_received = false;							/** ... is set to true when font list is sent for the first time. */

var success_js = false;								/** ... is set to true when main fingerprinting was successful, i.e. AJAX request was completed. */
var success_fonts = false;							/** ... is set to true when font fingerprinting was successful, i.e. AJAX request was completed. */
var processing_js = false;							/** ... is set to true when main function (fingerprint()) was invoked for the first time. */
var msie = (document.all && !window.opera);			/** ... is set to true when current browser is Microsoft Internet Explorer. */

/** Create HTTP objects. */
try {
	/** Non-Microsoft way: */
	http[0] = new XMLHttpRequest();
	http[1] = new XMLHttpRequest();
} catch (e_microsoft_new) {
	try {
		/** Newer Internet Explorer: */
		http[0] = new ActiveXObject("Msxml2.XMLHTTP");
		http[1] = new ActiveXObject("Msxml2.XMLHTTP");		
	} catch (e_microsoft_old) {
		try {
			/** Older Internet Explorer: */
			http[0] = new ActiveXObject("Microsoft.XMLHTTP");
			http[1] = new ActiveXObject("Microsoft.XMLHTTP");			
		} catch (e) {
			http[0] = false;
			http[1] = false;
		}
	}
}


/**
 * fingerprint function.
 * 
 * Main function, will be invoked after the PNG image was loaded or 1.5 seconds after window.onload event.
 */
function fingerprint() {
	/**
	 * If process_js is true, the function was already invoked either after PNG image was loaded or 1.5 seconds after window.onload event, whatever was first.
	 */	
	if (!processing_js) {
		processing_js = true;
		debug('fingerprinting...');
	 
		/** fp includes all data retrievied within this file. */
		var fp = new Object();
		var d = new Date();
		var dpi = getDPI();
	
		/** Start off by getting all System colors */
		fp = getSystemColors();
		
		/** Collect some more data... */
		//fp['png_id']					= getPngId();
		fp['document_referrer']			= getProperty("document.referrer");
		fp['navigator_appCodeName'] 	= getProperty("navigator.appCodeName");
		fp['navigator_appName']			= getProperty("navigator.appName");
		fp['navigator_appVersion']		= getProperty("navigator.appVersion");
		fp['navigator_cookieEnabled']	= (getProperty("navigator.cookieEnabled") == true ? 1 : 0);
		fp['navigator_language']		= getProperty("navigator.language || navigator.browserLanguage");
		fp['navigator_platform']		= getProperty("navigator.platform");
		fp['navigator_userAgent']		= getProperty("navigator.userAgent");
		fp['screen_width']				= getProperty("screen.width");
		fp['screen_height']				= getProperty("screen.height");
		fp['screen_avail_width']		= getProperty("screen.availWidth");
		fp['screen_avail_height']		= getProperty("screen.availHeight");
		fp['color_depth']				= getProperty("(screen.colorDepth ? screen.colorDepth : screen.pixelDepth)");
		fp['dpi_x']						= dpi[0];
		fp['dpi_y']						= dpi[1];
		fp['devicePixelRatio']			= getProperty("window.devicePixelRatio * 100");
		fp['timezone_offset']			= d.getTimezoneOffset();
		fp['java_enabled']				= (getProperty("navigator.javaEnabled()") == true ? 1 : 0);
		fp['plugin_flash']				= getFlashVersion();
		fp['plugin_adobe_acrobat']		= getAdobeAcrobatVersion();
		fp['plugin_silverlight']		= getSilverlightVersion();
		
		fp['mimetypes']					= getMimeTypes();
		fp['plugins']					= getPlugins();
		
		console.log(fp);
		document.getElementById('plugins').innerHTML=fp.plugins.reduce(function(a,e){return a+'<br>'+e},'');
		/** Transform object into XML and send it to the server. */		
		//var xml = createXml(fp);
		//sendAjax(xml, 0);
	}
}

/**
 * getPngId function.
 *
 * Reads saved ID out of cached PNG image.
 *
 * @return ?number Returns ID (range 0 to 256^6) or null in case of error.
 */
function getPngId() {
	try {
		var png = document.getElementById('pngid');
		
		/** Create a new two dimensional canvas element */
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');

		/** Draw the existing PNG image into the empty canvas */
		ctx.drawImage(png, 0, 0);

		/** Load pixel data stored in the canvas object (start in the top left corner and read 2x1 pixel) */					
		var img_data = ctx.getImageData(0, 0, 2, 1);
		var pix = img_data.data;
		
		var dec = 0;
		var r, g, b;
		var hex = '';
		var i_start = 0;
		
		/**
		 * Known issue:
		 * Internet Explorer has problems reading pixel data and sometimes returns wrong values (maybe due to a new compression of the image?)
		 * This problem can be minimized when the image is only 1x1 pixel. So in case of Internet Explorer try to evaluate only the right pixel.
		 * This decreases the range of the ID from 0 to 256^3, but it's better than nothing :-).
		 */
		if (msie)
			i_start = 1;
		
		for (var i = i_start; i < 2; i++) {
			/** Read RGB Values #RRGGBB */
			r = pix[(i * 4) + 0].toString(16).lpad("0", 2);
			g = pix[(i * 4) + 1].toString(16).lpad("0", 2);
			b = pix[(i * 4) + 2].toString(16).lpad("0", 2);
			
			hex = hex + r.toString() + g.toString() + b.toString();
			debug(r + ' ' + g + ' ' + b);
		}
		
		/** Convert hex values to decimal */
		dec = parseInt(hex, 16);
	
		return dec;		
	} catch (e) {
		debug('ERROR PNG: ' + e.toString());
		return null;
	}
}


/**
 * getProperty function.
 *
 * Evaluates given parameter. This function is a helper function only and fetches potential errors, if a property does not exist.
 *
 * @param {string} prop Expression (property) to be evaluated.
 * @return {string} The result of the evaluated statement.
 */

function getProperty(prop) {
	try {
		return eval(prop);
	} catch (e) {
		return null;
	}
}

/**
 * addFlash function.
 *
 * Adds an Adobe Flash file to the DOM. This Flash application should fetch all fonts installed on the client's OS.
 */
function addFlash() {
	try {
		/**
		 * Microsoft Internet Explorer does not activate embedded objects that are added
		 * using JavaScript/DOM. In case the client's browser is MSIE, throw an error.
		 */
		if (msie)
			throw "msie-fallback";

		/** Create flash object and add parameters */
		var flash = document.createElement('object');
		flash.setAttribute('id', 'flashFont');
		flash.setAttribute('name', 'flashFont');
		flash.setAttribute('type', 'application/x-shockwave-flash');
		flash.setAttribute('width', '1');
		flash.setAttribute('height', '1');
		flash.setAttribute('data', FLASH_PATH);
		
		/** Create subelement Param and add it to the object element. */
		var param = document.createElement('param');
		param.setAttribute('name', 'movie');
		param.setAttribute('value', FLASH_PATH);
		flash.appendChild(param);
		
		/** Append created Flash object to the document object model. */
		document.getElementsByTagName('body')[0].appendChild(flash);
	} catch (e) {
		/** Internet Explorer workaround */
		flashHelperIE.innerHTML = '<object id="flashFont" name="flashFont" type="application/x-shockwave-flash" width="1" height="1" data="' + FLASH_PATH + '"><param name="movie" value="' + FLASH_PATH + '" /></object>';
	}
}

/**
 * receiveFonts function.
 * 
 * This function is called by the embedded Flash application.
 * See also: http://www.maratz.com/blog/archives/2006/08/18/detect-visitors-fonts-with-flash/
 *
 * @param {string} f A comma-seperated String listing all fonts installed on the user's OS.
 */
function receiveFonts(f) {
    var obj = document.getElementById('flashFont')
    var fonts, fontlist;
    var fp = new Object();
 
    /** In some cases this method is called twice. Evaluating font list once is sufficient, so skip it the second time. */
    if (!fonts_received) {
    	/** If parameter is not empty use it. */
	    if (typeof(f) != 'undefined') {
	        fonts = unescape(f);
	    /** Different approach, especially for the Internet Explorer */
	    } else if (typeof(obj.GetVariable) != 'undefined') {
	        fonts = obj.GetVariable('/:user_fonts');
	    }
	    
	    /** If one of the two approaches succeeded ... */
	    if(typeof(fonts) == 'string') {
	        /* ... convert String into an Array. */
	        fontlist = fonts.split(',');
	        fp['fonts'] = fontlist;
	        
	        /* ... create XML and send it to the server. */
	        var t = createXml(fp);
	        sendAjax(t, 1);
	        
	        /* Set font_received = true, preventing that this function is executed twice. */
	        fonts_received = true;
	    }
	}

		console.log(fp);

}


/**
 * getFlashVersion function.
 *
 * Checks whether Adobe Flash plugin is installed on the client's computer. If so, it returns the version installed.
 * See also: http://www.prodevtips.com/2008/11/20/detecting-flash-player-version-with-javascript/
 *
 * @return {?string} Version number in case of Adobe Flash can be found, NULL otherwise.
 */
function getFlashVersion() {
	/**
	 * Try to detect the Version number using ActiveX. This will work in Internet Explorer, other browsers will throw an error.
	 */
	try {
		try {
			/**
			 * Old versions of Flash and Internet Explorer could cause a possible crash.
			 * If Flash Player version 6.x is installed, do not check minor version number.
			 * See also: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
			 */				
			var obj = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');

			try {
				obj.AllowScriptAccess = 'always';
			} catch(e) {
				return '6.0.0';
			}
		} catch(e) {

		}
		
		/**
		 * If a newer version than Flash Player 6 is installed and the current browser is ActiveX-capable (Internet Explorer),
		 * get the version number installed. If it fails, it will throw an erorr.
		 */
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, '.').match(/^.?(.+),?$/)[1];
	} catch(e) {
		/**
		 * Error handling. This can be caused by
		 * a) browser is Internet Explorer and no flash is installed, or
		 * b) browser is not ActiveX-capable (no Internet Explorer).
		 */
		try {
			/**
			 * If b) try to check if Flash is installed by using the navigator.mimeTypes property. This will throw an error in Internet Explorer.
			 */
			if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
				return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ".").match(/^.?(.+),?$/)[1];
			}
		} catch(e) {
			/** Probably no Flash installed or version number could not be detected. */
		}
	}
	return null;
}

/**
 * getAdobeAcrobatVersion function.
 *
 * Retrieves the version number of an installed Adobe Reader/Acrobat plugin.
 * On how to detect a plugin in Internet Explorer, see also: http://www.matthewratzloff.com/blog/2007/06/26/detecting-plugins-in-internet-explorer-and-a-few-hints-for-all-the-others/
 * 
 * @return {?string} Version number in case of Adobe Reader/Acrobat can be found, NULL otherwise.
 */
function getAdobeAcrobatVersion() {
	/** If browser is ActiveX-capable (Internet Explorer)... */
	if (window.ActiveXObject) {
		var obj = null;
				
		try {
			/** New versions of Acrobat/Reder **/
			obj = new ActiveXObject('AcroPDF.PDF');
		} catch(e) {
		
		}

		if (!obj) {
			try {
				/** Try to check for old versions, if first approach failed. **/
				obj = new ActiveXObject('PDF.PdfCtrl');
			} catch (e) {
				return null;
			}
		}
		
		/** If one of the approached succeeded, try to get the version number. */
		if (obj) {
			var version = obj.GetVersions().split(',');
			version = version[0].split('=');
			version = parseFloat(version[1]);
			return version;
		} else {
			return null;
		}	
	/** Try to get version number the non-ActiveX-way. **/
	} else {
		for (var i = 0; i < navigator.plugins.length; i++) {
			if (navigator.plugins[i].name.indexOf('Adobe Acrobat') != -1) {
				return navigator.plugins[i].description.replace(/\D+/g, ".").match(/^.?(.+),?$/)[1];
			}
		}
		return null;
	}
				
}

/**
 * getSilverlightVersion function.
 *
 * Retrieves the version number of an installed Microsoft Silverlight plugin.
 * 
 * @return {?string} Version number in case of Adobe Reader/Acrobat can be found, NULL otherwise.
 */
function getSilverlightVersion() {
	/** Is ActiveX-capable (= Internet Explorer) ? */
	if (window.ActiveXObject) {
		try {
			/** Create Silverlight ActiveX object */
			var obj = new ActiveXObject('AgControl.AgControl');

			/**
			 * Check for released versions of Microsoft Silverlight.
			 * A list of releases can be found here: http://www.microsoft.com/en-us/download/details.aspx?id=12121
		     * This approach is definitely faster than doing it the iteratively and checking all possible versions a.b.c.d
		     * The 'iterative' approach also detects inofficial releases:
			 *	
			 *	var v = new Array(1, 0, 0, 0);
			 *	var pos = 0;
			 *	var s = '';
			 *	
			 *	while (pos >= 0 && pos <= 3) {
			 *		s = v[0] + '.' + v[1] + '.' + v[2] + '.' + v[3];
			 *		b = obj.isVersionSupported(s);
			 *		if (b) {
			 *			v[pos]++;
			 *		} else {
			 *			v[pos]--;
			 *			pos++;
			 *		}
			 *	}
			 *	s = v[0] + '.' + v[1] + '.' + v[2] + '.' + v[3];
			 *	return s;
			 */
				
			/** List of official version and build numbers, descending */
			var v = new Array('5.1.10411.0', '5.0.61118.0', '5.0.60818.0', '5.0.60401.0', '4.1.10329.0', '4.1.10111.0', '4.0.60831.0', '4.0.60531.0', '4.0.60310.0', '4.0.60129.0', '4.0.51204.0', '4.0.50917.0', '4.0.50826.0', '4.0.50524.00', '4.0.50401.00', '3.0.50611.0', '3.0.50106.00', '3.0.40818.00', '3.0.40723.00', '3.0.40624.00', '2.0.40115.00', '2.0.31005.00', '1.0.30715.00', '1.0.30401.00', '1.0.30109.00', '1.0.21115.00', '1.0.20816.00');
			
			var i = -1;
			var b = false;
			
			/**
				Check if version is supported by beginning with the newest version.
				Stop loop if a version is supported or all released version have been checked.
			 */
			do {
				i++;
				b = obj.isVersionSupported(v[i]);
			} while (!b && i < v.length);
			
			if (b) {
				return v[i];
			} else {
				return null;
			}

		} catch (e) {
			return null;
		}
	/** Check Silverlight version in other browsers, plugin.description is version vernumber */
	} else {
		for (var i = 0; i < navigator.plugins.length; i++) {
			if (navigator.plugins[i].name.indexOf('Silverlight') != -1) {
				return navigator.plugins[i].description;
			}
		}
		return null;
	}
}

/**
 * getPlugins function.
 *
 * Retrieves all installed plugins. Works in all browsers that support navigator.plugins, i.e. all except Internet Explorer.
 *
 * @return {?Array.<string>} Array of all installed plugins (or null if they cannot be retrieved); elements (Strings) format: <plugin name>: <plugin description> (<plugin filename>)
 */ 
function getPlugins() {
	var a = new Array();
	
	try {
		for (var i = 0; i < navigator.plugins.length; i++) {
			a.push(navigator.plugins[i].name ;//+ ': ' + navigator.plugins[i].description + ' (' + navigator.plugins[i].filename + ')')
		}
		return a;
	} catch (e) {
		return null;
	}
}


/**
 * getMimeTypes function.
 *
 * Retrieves all supported Mime types. Works in all browsers that support navigator.mimeTypes, i.e. all except Internet Explorer.
 *
 * @return {?Array.<string>} Array of all supported Mime types (or null if they cannot be retrieved); elements (Strings) format: <mimeType type>: <mimeType description>
 */ 
function getMimeTypes() {
	var a = new Array();
	
	try {
		for (var i = 0; i < navigator.mimeTypes.length; i++) {
			a.push(navigator.mimeTypes[i].type + ': ' + navigator.mimeTypes[i].description);
		}
		return a;
	} catch (e) {
		return null;
	}
}

/**
 * getDPI function.
 *
 * Calculates User's DPI setting (experimental).
 * I found this script here:
 * http://stackoverflow.com/questions/476815/can-you-access-screen-displays-dpi-settings-in-a-javascript-function
 * During my testing period it always returned 96, let's see whether it returns something else on other computers.
 *
 * @return {?Array.<number>} DPI-Setting, [0]: width, [1]: height. In case of error, return (0,0).
 */

function getDPI() {
	var dpi = new Array(2);

	/** Create an empty DIV container, width = height = 1 inch */
	try {
		var div = document.createElement('div');
		div.style.position = 'absolute';
		div.style.left = '-100%';
		div.style.top = '-100%';
		div.style.width = '1in';
		div.style.height = '1in';
		div.id = 'dpi';
		document.getElementsByTagName('body')[0].appendChild(div);
	} catch (e) {
		document.write('<div id="dpi" style="position:absolute; left:-100%; top:-100%; width:1in; height:1in"></div>');
	}
	
	/** Get real pixel width / height */
	try {
		dpi[0] = document.getElementById('dpi').offsetWidth;
		dpi[1] = document.getElementById('dpi').offsetHeight;
		return dpi;
	} catch (e) {
		return Array(0, 0);
	}
}

/**
 * getSystemColors function.
 *
 * This function tries to get the system colors of the user's OS. These include the color for windows (usually white) or Desktop background color.
 * The function tries to create an empty DIV object and sets the background color to a system color. Subsequently, the RGB values is read by
 * JavaScript's function getComputedValue.
 *
 * @return {?Object.<string, string>} Associative array ("System Color Keyword" => hex value with preceding '#'), NULL if RGB values cannot be retrieved.
 */
function getSystemColors() {
	/** All system colors specified by W3C, see: http://www.w3.org/TR/css3-color/#css-system */
	var colors = new Array('ActiveBorder', 'ActiveCaption', 'AppWorkspace', 'Background', 'ButtonFace', 'ButtonHighlight', 'ButtonShadow', 'ButtonText',
					 	   'CaptionText', 'GrayText', 'Highlight', 'HighlightText', 'InactiveBorder', 'InactiveCaption', 'InactiveCaptionText',
					 	   'InfoBackground', 'InfoText', 'Menu', 'MenuText', 'Scrollbar', 'ThreeDDarkShadow', 'ThreeDFace', 'ThreeDHighlight',
					 	   'ThreeDLightShadow', 'ThreeDShadow', 'Window', 'WindowFrame', 'WindowText');

	/** Results, saved in an associative array */
	var obj = new Object();				 	   

	/** Try to create an empty DIV object */	
	try {
		var div = document.createElement('div');
		div.style.display = 'block';
		div.style.visibility = 'hidden'
		div.style.position = 'absolute';
		div.style.left = '-100px';
		div.style.top = '-100px';
		div.style.width = '5px';
		div.style.height = '5px';
		div.style.backgroundColor = '#000000';
		div.id = 'syscolor';
		document.getElementsByTagName('body')[0].appendChild(div);
	} catch (e) {
		document.write('<div id="syscolor" style="display:block; visibility:hidden"></div>');
	}
	
	try {
		if (typeof(div) == 'undefined')
			var div = document.getElementById('syscolor');
		
		/** Regular expression, detect CSS-style RGB color information like 'rgb(255,255,0)' */
		var re = /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/;
		var c;
		
		/** Identifier is used for names in associative array obj. These match the names of coloumns in the MySQL table (system color with 'color_' prefix). */
		var identifier;
		
		for (var i = 0; i < colors.length; i++) {
			/** Set background color to one of the system colors */
			div.style.backgroundColor = colors[i];
			
			identifier = 'color_' + colors[i].toString().toLowerCase();
			
			/** Different methods of getting real RGB values */
			if (div.currentStyle) {	/** Browser that supports 'div.currentStyle' (Internet Explorer */
				c = div.currentStyle['backgroundColor'];
			} else { /** Other browsers */
				c = document.defaultView.getComputedStyle(div, null).getPropertyValue('background-color');
			}
			
			/**
			 * Check if retrieved color is not null and is not the name of the system color.
			 * When run in Internet Explorer most versions only return the name of the system color (e.g. 'ActiveBorder'),
			 * so we cannot retrieve real RGB values.
			 */
			if (c != null && c.toString().toLowerCase() != colors[i].toLowerCase()) {
				c = c.toString();
				
				/** Check if returned value is hex-formatted (e.g. #ffff00) or in 'rgb(r,g,b)' format */
				results = re.exec(c);
				
				if (results != null) {
					/** 'rgb(r,g,b)' format: Use return values and shift them bitwise to create hex-format */
					//obj[identifier] = ('#' + (parseInt(results[1]) << 16 | parseInt(results[2]) << 8 | parseInt(results[3])).toString(16)).toString();
					obj[identifier] = '#' + (parseInt(results[1])).toString(16).lpad("0", 2) + (parseInt(results[2])).toString(16).lpad("0", 2) + (parseInt(results[3])).toString(16).lpad("0", 2);

				} else {
					/** Probably hex format: Check if color information already includes a hash at the beginning. If not, add it. */
					if (c.substr(0, 1) != '#')
						c = '#' + c;
					
					/** Check if string does not contain more than 7 characters. If so, it is probably a well formated hex-coded color information. */
					if (c.length <= 7)
						obj[identifier] = c.toString();	
				}
			} else {
				/** Color information cannot be retrieved. */
				obj[identifier] = null;
			}
		}
		return obj;
	} catch(e) {
		return obj;
	}
}

/** createXml function.
 *
 * Create a well-formed and valid XML structure.
 * See DTD_URL for Document Type Definition.
 * 
 * @param {Object<string,string>} obj Associative array containing all determined properties of the user's browser and OS. Property names are coloumn names of MySQL table.
 * @return string Returns string containing well-formed and valid XML. In case of error return an empty string.
 */
 function createXml(obj) {
 	/** Valid parameter submitted? */
	if (typeof(obj) == 'object') {
		/** Create XML header */
		var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>';
		xml += '<!DOCTYPE bfp SYSTEM "' + DTD_URL + '">';
		
		/** Create XML root element containing user's unique ID and current dataset ID */
		xml += '<bfp uid="' + uid + '" dbid="' + db_id + '">';
		
		for (var elem in obj) {
			/** 
			 * Check type/format of saved values. Possible cases:
			 * null: 		No data could be retrieved. Submit childless <item>-Element.
			 * array:		Element contains subelements. This is used by sending the user's fonts, installed plugins or supported mime-types.
			 * int:			Numeric data, has to be kept apart from String values (MySQL: Strings have to be enclosed with quotation marks)
			 * hex:			Numeric (haxadecimal) values, identified by a preceding hash. Will be submitted without hash and later on converted to INT.
			 * string:		Everything else. String will be escaped.
			 */
			if (typeof(obj[elem]) == 'undefined' || obj[elem] == null || obj[elem] == '') {							/** Case null */
				xml += '<item name="' + elem + '" format="null" />';
			} else if (typeof(obj[elem]) == "object") {												/** Case array */
				var a = obj[elem];
				
				if (a.length == 0) {
					/** If array does not contain any element switch to format 'null' */
					xml += '<item name="' + elem + '" format="null" />';
				} else {
					/** Let php script sort all elements, except fonts. The order of fetched fonts is important. */
					var sort = (elem == 'fonts' ? 0 : 1);
					xml += '<item name="' + elem + '" format="array" sort="' + sort + '">';
					
					/** List all elements of array */
					for (var i = 0; i < a.length; i++) {
						xml += '<subitem>' + a[i].toString().escapeXml() + '</subitem>';
					}
				
					xml += '</item>';
				}
				
			} else if (!isNaN(obj[elem])) {															/** Case int */
				xml += '<item name="' + elem + '" format="int">';
				xml += obj[elem];
				xml += '</item>';				
			} else if (obj[elem].toString().substr(0, 1) == '#') {									/** Case hex */
				xml += '<item name="' + elem + '" format="hex">';
				xml += obj[elem].toString().substr(1);
				xml += '</item>';
			} else {																				/** Case string */
				xml += '<item name="' + elem + '" format="string">';
				xml += obj[elem].toString().escapeXml();
				xml += '</item>';
			}
		}
		
		xml += '</bfp>';
		debug(xml);
		
		return xml;
	} else {
		return '';
	}
}

/**
 * sendAjax function.
 *
 * Invokes browser's HTTP functions to send a string to a specified PHP script.
 *
 * @param string contents Data to be submitted (should be XML).
 * @param number http_index Which object should be used? (0: main, 1: fonts)
 * @return boolean Return false if error occurs, true otherwise.
 */
function sendAjax(contents, http_index) {
	try {
		/** Send all data using HTTP-POST */
		http[http_index].open('POST', AJAX_PHP, true);
		http[http_index].setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		/** Use http_response function when state changes or when data is returned */
		http[http_index].onreadystatechange = function() {
    		http_response(http_index);
    	};
    	
    	/** Send data. */
    	http[http_index].send("xml=" + encodeURIComponent(contents));
    	
    	return true;
    } catch (e) {
	    return false;
    }
}

/**
 * http_response function.
 *
 * Will be invoked when the state of http object changes. When status 200 is reached (HTTP OK), collect the retrieved data.
 *
 * @param http_index Which object should be used? (0: main, 1: fonts)
 */
function http_response(http_index) {
	/** Wait for readyState = 4 and HTTP status = 200 */
	if (http[http_index].readyState == 4) {
		if (http[http_index].status == 200) {
			/** Get raw response text */
			var response = http[http_index].responseText;

			debug(http_index + " response: " + response);

			if (http_index == 0)
				success_js = true;
			else
				success_fonts = true;

			/** If all responses were sent invoke fp_done. This function has to be declared in the HTML document that includes this file. */
			if (success_fonts && success_js) {
				fp_done();
			}
		}
	}
}

/**
 * addPng function.
 *
 * Adds a 2x1 pixels PNG file to the DOM. The image is created by a PHP script containing a number "hidden" in rgb values.
 */
function addPng() {
	try {
		var img = document.createElement('img');
	
		/**
		 * If image is loaded correctly from cache, the onload function will be invoked.
		 * After the image is loaded, call the main fingerprint function to start gathering information.
		 * Delete a potential cookie that was needed to reset the ID for the PNG image.
		 */
		img.onload = function() {
			if (this.src != '') {
				debug("PNG OK");
				window.setTimeout('fingerprint()', 50);	
				document.cookie = 'create_png=; expires=' + COOKIE_EXPIRE_PAST;
			}
		}
	
		/**
		 * If browser was not able to load image from cache (maybe because user cleared cache), onerror function will be invoked.
		 * If this happens, set image source to null, set a cookie with current dataset id and try to reload the image.
		 * Due to a set cookie ("create_png") the PNG_PHP script will create a new image.
		 */
		img.onerror = function() {
			if (this.src != '') {
				this.src = '';
				debug("PNG ERROR!");
				document.cookie = 'create_png=' + db_id + '; expires=' + COOKIE_EXPIRE_FUTURE;
				this.src = PNG_PHP;
			}
		}
	
		img.id = 'pngid';
		img.src = PNG_PHP;
		img.style.position = 'absolute';
		img.style.width = '2px';
		img.style.height = '1px';
		img.style.top = '0px';
		img.style.left = '0px';
		
		/**
		 * It is extremely important to set visibility = hidden.
		 * Some browsers (at least Safari 6.0 / Mac OS 10.8) will return wrong values when reading RGB values (see getPngId function) while the image is visible
		 * or even was visible in the same session. In that case, browser will return Generic RGB and no Native RGB values.
		 */
		img.style.visibility = 'hidden';
		
		/** Append image to the document body. */
		document.getElementsByTagName('body')[0].appendChild(img);
	} catch (e) {
		/** In case of error do not add an image and ignore it */
	}
}

/**
 * window.onload event.
 *
 * When browser has loaded and rendered the entire document, initialize fingerprinting.
 */
window.onload = function() {
	/** Check if skip variable is set in html file (normally set to true when fingerprinting has been done today. */
	if (typeof(skip) != 'undefined' && skip) {
		debug('onload event, skip = true');
		abortFingerprinting();
	} else {
		debug('onload event, skip = false');
		/** Add Flash file for retrieving installed fonts and add PNG image */
	
		addFlash();
		//addPng();
			
		/** Typically fingerprint() should be invoked after PNG image is loaded. If, under what circumstances whatsoever, the PNG could not be loaded, call that function after 1.5 seconds. */
		window.setTimeout('fingerprint()', 1500);
		
		/** If fingerprint() fails in any way or one of the AJAX requests fails (no sever response), abort fingerprinting after 3 seconds. */
		window.setTimeout('abortFingerprinting()', 3000);
	}
}

/**
 * abortFingerprinting function.
 *
 * This function will be called 3 seconds after the page was rendered completely. It invokes fp_done() if one of the HTTP requests failed or any other error occured.
 */
function abortFingerprinting() {
	if (!success_fonts || !success_js) {
		debug('abort');
		/** If any of the requests were not successful pretend they were successful */
		success_fonts = true;
		success_js = true;
		fp_done();
	}
}

/**
 * debug function.
 *
 * Write to developer console for debugging purposes.
 *
 * @param string msg Message to be sent to console.log
 */
function debug(msg) {
	if (false) {
		try {
			/** Show message dialog on touch devices */
			if ('ontouchstart' in document.documentElement) {
				alert(msg);
			} else {
				console.log(msg);
			}
		} catch (e) {
			console.log(msg);
		}
	}
}
