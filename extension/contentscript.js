/*
 * parts of this file is from https://github.com/Jermolene/TiddlyWiki5
 * which is licensed under the BSD format copyright Jermolene Ruston
 */
document.addEventListener('DOMContentLoaded', injectMessageBox, false);
var tiddlywikilocations = "tiddlywikilocations";
var patherrormsg = "Automatic saving of media is not possible.\nAs your TW is not within the contolled directory.";
var othersaver1 = "savemedia has detected that another mediasaver called ";
var othersaver2 = " is install. Currently only one saver is supported therefore - savemedia will not activate";

var backup = true;
var tw5 = true;
/*
 * we may want to download a dummy file and use the download api to see 
 * if it lands in the correct dir,
 * the backgound would set a value we read here and if set save a test file.
 */
 	
function pathto() {
	// Get the pathname of this document
	var lastpos, pathname = window.location.toString().split("#")[0];
	lastpos = pathname.lastIndexOf('/');
	pathname = pathname.slice(0,lastpos);
	// Replace file://localhost/ with file:///
	if(pathname.indexOf("file://localhost/") === 0) {
		pathname = "file://" +pathname.substr(16);
	}
	// Windows path file:///x:/blah/blah --> x:\blah\blah
	if(/^file\:\/\/\/[A-Z]\:\//i.test(pathname)) {
		// Remove the leading slash and convert slashes to backslashes
		pathname = decodeURI(pathname.substr(8)).replace(/\//g,"\\");
	// Firefox Windows network path file://///server/share/blah/blah --> //server/share/blah/blah
	} else if(pathname.indexOf("file://///") === 0) {
		pathname = "\\\\" + decodeURI(pathname.substr(10)).replace(/\//g,"\\");
	// Mac/Unix local path file:///path/path --> /path/path
	} else if(pathname.indexOf("file:///") === 0) {
		pathname = decodeURI(pathname.substr(7));
	// Mac/Unix local path file:/path/path --> /path/path
	} else if(pathname.indexOf("file:/") === 0) {
		pathname = decodeURI(pathname.substr(5));
	// Otherwise Windows networth path file://server/share/path/path --> \\server\share\path\path
	} else {
		pathname = "\\\\" + decodeURI(pathname.substr(7)).replace(new RegExp("/","g"),"\\");
	}
	
	return pathname;
}
function failed () {
chrome.notifications.create({
      type: 'basic',
      title: 'Download failed media saver',
      message: 'conection closed unexpectively in midia saver.'
    });
}
function injectMessageBox(doc) {
	var s;
	doc = document;

	// Inject the message box
	var messageBox = doc.getElementById("csaver-message-box");
	if(messageBox) {
		var othersw = messageBox.getAttribute("data-message-box-creator")|| null;
		if (othersw) {
			alert (othersaver1+othersw+othersaver2);
			return;
		} else {
			messageBox.setAttribute("data-message-box-creator","mediasaver");
		} 
	} else {
		messageBox = doc.createElement("div");
		messageBox.id = "csaver-message-box";
		messageBox.style.display = "none";
		messageBox.setAttribute("data-message-box-creator","savemedia3");
		doc.body.appendChild(messageBox);
	}
	// Attach the event handler to the message box
	messageBox.addEventListener("csaver-save-file",function(event) {
		// Get the details from the message
		var message = event.target,	path, 
			cname = message.getAttribute("data-csaver-contentname"),
			content = message.getAttribute("data-csaver-content"),
			subdir = message.getAttribute("data-csaver-subdir"),
			mtype = message.getAttribute("data-csaver-taget-type"),	
			path =pathto();
			/* -alternative method without probing the download dir
			path = pathto().split(tiddlywikilocations+"/");
			if ( path.length != 2) {
				alert(patherrormsg);
				return false;
			}
			path = tiddlywikilocations+"/"+(path)[1];
			*/
		//need to change cname into a valid file name
			cname = cname.replace(/<|>|\:|\"|\||\?|\*|\/|\\|\^/g,"_");
			subdir =  subdir.replace(/<|>|\:|\"|\||\?|\*|\/|\\|\^/g,"_");
		// Remove the message element from the message box
		message.parentNode.removeChild(message);
		// Save the file
		//saveFile(path,cname,content,backup,mtype,tw5,subdir,"save",function(response) { - alt 
		
		saveFile(path,cname,content,backup,mtype,tw5,subdir,"locate",function(response) {
		// Send a confirmation message

			var event1;
			if (!response) {console.log ("msaver: null response"); failed(); return;}
			console.log ("msaver: response is "+response.status);
			if (response.status === "fail" ) {
				failed();
				alert(patherrormsg);
			} else { 
				console.log ("msaver: savefile");
			}
		});//end of callback
		return false;
	},false);
}

 function saveFile(filePath,cname,content,backup,mtype,tw5,subdir,type,callback) {

	// Save the file
	try {
		var msg = {};
		msg.filePath = filePath;
		msg.txt = content;
		msg.name = cname;
		msg.backup = backup;
		msg.type = type;
		msg.tw5 = tw5;
		msg.mtype = mtype;
		msg.subdir = subdir;
		console.log("from cs: we are inside downloads at "+msg.filePath);
		chrome.runtime.sendMessage(msg,callback);
		return true;
	} catch(ex) {
		console.log("alerted "+ex)
		alert(ex);
		return false;
	}
}

