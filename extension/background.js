var testmode = false; //set to true to avoid path test
var minutebacks = false; //set to true to allow backs every minute for testing

var  $ = {"/":"/"};
var os = "notwin";var testbase ;//	'readMediaSaverInstruction';
var round = '59723833'; //by rotating this string of digits we can have 8 unique named test files for simutaneous use
						//ie testpath = testbase+round+'.html';rotate(round) for next test file
var rlen = round.length - 1;
var testfilecontent = "This is a test file for csaver extension. If you are reading this file an error has ocurred - this file can be deleted";
chrome.runtime.getPlatformInfo( function(info) {if(info.os == "win") { $["/"] = "\\"; os = "win";}});
var dldir ="";
var dataURItoBlob = function(dataURI, dataTYPE) {
        var bin = atob(dataURI), arr = [];
        for(var i = 0; i < bin.length; i++) arr.push(bin.charCodeAt(i));
        return new Blob([new Uint8Array(arr)], {type: dataTYPE});
}

var stCreateObjectURL;
var stCreateProbeURL;
if (URL && URL.createObjectURL && typeof URL.createObjectURL === 'function' && Blob) {
	stCreateObjectURL= function(text,type){
		console.log("csaverbg: "+text +":" +type);
		return URL.createObjectURL(dataURItoBlob(text,type));
	}
		stCreateProbeURL = function(){return   URL.createObjectURL(new Blob([testfilecontent], {type: 'text/plain'}));}
	
} else {
	stCreateObjectURL= function(text,type){
		if (type) { 
			return 'data:'+type+';base64,' + text;
		} 
		return "data:"+'text/plain'+"," + encodeURIComponent(text);
	}
	stCreateProbeURL= function(){return "data:text/plain," + encodeURIComponent(testfilecontent);}
}
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    console.log("csaverbg: got request");
    
/*    function dodownloadalt (msg){	
	var subdir,path = msg.filePath;
	if (path=="") path = ".";
	console.log("msaver path:"+path);
	subdir = msg.subdir?$["/"]+msg.subdir:"";	
	console.log("msaver: do "+ path+subdir+$["/"]+ msg.name);
	chrome.downloads.download({
		url:stCreateObjectURL(msg.txt,msg.mtype),
		filename: path+subdir+$["/"]+ msg.name,
		conflictAction: 'overwrite'
	},
	function(id) {
		
		if (chrome.runtime.lastError) {
			console.error('Download failed to start:', chrome.runtime.lastError.message);
			sendResponse({status:"fail"});
			return;
		  }
		console.log("msaver: saving "+path+subdir+$["/"]+ msg.name);
		sendResponse ({status:"saving"});

	});
}*/
    function dodownload (msg){	
	var subdir,path = msg.filePath.slice(msg.dldir.length+1);//cutoff the "/"as well
			console.log("csaver filePath:"+msg.filePath);
	console.log("csaver path:"+path);
	subdir = msg.subdir?$["/"]+msg.subdir:"";	
	console.log("csaver: do "+ path+subdir+$["/"]+ msg.name);
	chrome.downloads.download({
		url:stCreateObjectURL(msg.txt,msg.mtype),
		filename: path+subdir+$["/"]+ msg.name,
		conflictAction: 'overwrite'
	},
	function(id) {
		console.log("csaver: saved "+path+subdir+$["/"]+ msg.name);
		sendResponse ({status:"saved"});

	});
}

	/*///////////////////////// start ///////////////////////////////
	if (msg.type === "start") {
		console.log("csaverbg: start");
		msg.dldir=dldir;
		dodownloadalt(msg);
		return true;
	}
	*/
	
	////////////////////////// locate ///////////////////////////////
	if (msg.type === "locate") {
		console.log("csaverbg: locate");
		testbase = 'readMediaSaverInstruction';
		// first download check our destination is valid by download a dummy file first and then reading back the filepath	
		round = round[rlen] + round.substring(0, rlen);
		chrome.downloads.download({
			url: stCreateProbeURL(),
			filename: testbase+round+'.html',//=readMediaSaverInstruction59723833.html
			conflictAction: 'overwrite'
			},function(id){chrome.downloads.onChanged.addListener(function hearchange(deltas){
				// wait for completion
				if (deltas.id == id && deltas.state && deltas.state.current === "complete") {
					chrome.downloads.onChanged.removeListener(hearchange);
					chrome.downloads.search({id:id}, function(x){
						var firstloc;
						dldir = x[0].filename.split($["/"]+testbase)[0];// location of download dir
						if (os === "win") {//make drive letters the same case
							dldir = dldir.replace(/^./g, dldir[0].toLowerCase());
							msg.filePath = msg.filePath.replace(/^./g, msg.filePath[0].toLowerCase());
						}  
						firstloc = msg.filePath.indexOf(dldir);
						
						if (firstloc === 0) {console.log("csaverbg:  path "+msg.filePath +" on"+dldir);
							msg.dldir=dldir;
							dodownload(msg);
						} else {				
							console.log("csaverbg: failed path "+msg.filePath +"not on"+dldir);
							sendResponse({status:"failedpath",path:x[0].filename.split($["/"]+testbase)[0]});
						}
						
						chrome.downloads.removeFile(id,function(){chrome.downloads.erase({id:id})});//move this further up
					});
							
				}
				//
			})}
		)


		return true;
	}	
	
	return true;
});


