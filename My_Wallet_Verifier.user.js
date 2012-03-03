// ==UserScript==
// @name           My Wallet Verifier
// @namespace      blockchain
// @description    Verify javascript on My wallet pages
// @include        https://www.blockchain.info/wallet/*
// @include        https://blockchain.info/wallet/*
// @include        http://blockchain.info/wallet/*
// @include        http://www.blockchain.info/wallet/*
// ==/UserScript==

var baseURL = "https://blockchain.info/Resources/wallet/";
var githubURL = "https://raw.github.com/zootreeves/blockchain.info/master/";
    
function abort(message) {
    alert(message);
    alert('*** Serious Error - Javascript inconsistencies found. Maybe malicious - Do not Login! Please contact support@pi.uk.com');
    document.innerHTML = '';
    throw 'Exception';
};

var objects = document.getElementsByTagName('object');
for (var ii = 0; ii < objects.length; ii++){ 
    abort('Found unknown object tag');
}

var embeds = document.getElementsByTagName('embed');
for (var ii = 0; ii < embeds.length; ii++){     
    abort('Found unknown embed tag');
}

var jsattrs = [
					"onmousedown", 
					"onmouseup", 
					"onclick",
					"ondblclick",
					"onmouseover",
					"onmouseout",
					"onmousemove",
					"onkeydown",
					"onkeyup",
					"onkeypress",
					"onfocus",
					"onblur",
					"onload",
					"onunload",
					"onabort",
					"onerror",
					"onsubmit",
					"onreset",
					"onchange",
					"onselect",
					"oninput",
					"onpaint",
					"ontext",
					"onpopupShowing",
					"onpopupShown",
					"onpopupHiding",
					"onpopupHidden",
					"onclose",
					"oncommand",
					"onbroadcast",
					"oncommandupdate",
					"ondragenter",
					"ondragover",
					"ondragexit",
					"ondragdrop",
					"ondraggesture",
					"onresize",
					"onscroll",
					"overflow",
					"onoverflowchanged",
					"onunderflow",
					"onoverflowchanged",
					"onsubtreemodified",
					"onnodeinserted",
					"onnoderemoved",
					"onnoderemovedfromdocument",
					"onnodeinsertedintodocument",
					"onattrmodified",
					"oncharacterdatamodified"
];


for (var i in jsattrs) {   
   var jsattr = getElementsByAttribute(document,'*',jsattrs[i]);

    //Check for any inline javascript
    if (jsattr.length > 0) {
        abort('Inline javascript found ' + jsattr[0]);
    };
}


function startsWith(str, needle) {
    return(str.indexOf(needle) == 0);
};

function getElementsByAttribute(oElm, strTagName, strAttributeName){
    var arrElements = (strTagName == "*" && document.all)? document.all : oElm.getElementsByTagName(strTagName);
    var arrReturnElements = new Array();
    var oAttributeValue = (typeof strAttributeValue != "undefined")? new RegExp("(^|\\s)" + strAttributeValue + "(\\s|$)") : null;
    var oCurrent;
    var oAttribute;
    for(var i=0; i<arrElements.length; i++){
        oCurrent = arrElements[i];
        oAttribute = oCurrent.getAttribute(strAttributeName);
        if(typeof oAttribute == "string" && oAttribute.length > 0){
            arrReturnElements.push(oCurrent);
        }
    }
    return arrReturnElements;
}


//Check for any eternal src attributes
var srcs = getElementsByAttribute(document,'*','src');
for (var ii = 0; ii < srcs.length; ii++){ 
    var src = srcs[ii].getAttribute('src');
    
    //Allow jQuery from google
    if (!startsWith(src, '/') && !startsWith(src, 'https://ajax.googleapis.com')) {
       abort('Unknown src attribute ' + src);
    }
}

var scripts = document.getElementsByTagName('script');
for (var ii = 0; ii < scripts.length; ii++){ 
    var src = scripts[ii].getAttribute('src');

    
    if (src == null || src.length == 0) {
        abort('Inline javascript file found');
    } else {
        var func = function() {
            var filename = src.substring(src.lastIndexOf('/')+1);
            
            var localFileName = baseURL + filename;
            var githubFileName = githubURL + filename;
            
            GM_xmlhttpRequest({
              method: "GET",
              url: localFileName,
              onload: function(localResponse) {
                var localLines = localResponse.responseText.split('\n');
                
                GM_xmlhttpRequest({
                  method: "GET",
                  url: githubFileName,
                  onerror:function(gitHubResponse) {
                    if (gitHubResponse.status == 404) {
                     error('Script not found on github ' + filename);
                    } else {
                     error('Unknown error downloading script ' + filename);
                    }
                  },
                  onload: function(gitHubResponse) {
                    var githubLines = gitHubResponse.responseText.split('\n');

                    if (localLines.length != githubLines.length) {
                     abort('Different number of lines in ' + filename + ' to the script on github');
                    }
                    
                    for (var i = 0; i < localLines.length; ++i) {
                        if (localLines[i] != githubLines[i]) {
                          abort('Discrepency in ' + filename + ' line: ' + i + ' ' + localLines[i]);
                        }
                    }
                    
                    console.log('Verified ' + filename);
                  }
                });
              }
            });
        }();
    }
}
