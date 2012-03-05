window.addEventListener("load", function(event) {  
    var appcontent = document.getElementById("appcontent");   // browser  
    if(appcontent){  
      document.addEventListener("DOMContentLoaded", function(aEvent) {
        var doc = aEvent.originalTarget; // doc is document that triggered "onload" event  

        if (doc == null || doc.location == null)
            return;
        
        locationChanged(doc);
      }, true);  
    } 
},false);


function doVerification(document) {
    Application.console.log('Running My Wallet verifier\n');

    var baseURL = "https://blockchain.info/Resources/wallet/";
    var githubURL = "https://raw.github.com/zootreeves/blockchain.info/master/";
        
    function abort(message) {
        alert(message);
        alert('*** Serious Error - Javascript inconsistencies found. Maybe malicious - Do not Login! Please contact support@pi.uk.com');
      
        //Prevent user logging in
        document.write('');
        
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
            abort('Inline javascript found ' + jsattr[0].innerHTML);
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
        if (!startsWith(src, '/') && !startsWith(src, 'https://ajax.googleapis.com') && !startsWith(src, 'https://www.google.com') && !startsWith(src, 'about:blank') && !startsWith(src, 'https://www.youtube.com')) {
           abort('Unknown src attribute ' + src);
        }
    }

    function fetchResource(url, success) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            success(xhr.responseText);
          }
        }
        xhr.send();
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
                
                fetchResource(localFileName, function(localResponse) {
                    var localLines = localResponse.split('\n');

                    fetchResource(localFileName, function(gitHubResponse) {
                        var githubLines = gitHubResponse.split('\n');

                        if (localLines.length != githubLines.length) {
                         abort('Different number of lines in ' + filename + ' to the script on github');
                        }
                        
                        for (var i = 0; i < localLines.length; ++i) {
                            if (localLines[i] != githubLines[i]) {
                              abort('Discrepency in ' + filename + ' line: ' + i + ' ' + localLines[i]);
                            }
                        }
                        
                         Application.console.log('Verified ' + filename);
                    });
                });
            }();
        }
    }
}

function locationChanged(doc) {
    var location = doc.location;q
    
    try {
        if ((location.host == "blockchain.info" || location.host == "www.blockchain.info") && location.pathname.indexOf("/wallet/") != -1) {
            doVerification(doc);
        }
    } catch (e) {
        Application.console.log(e);
    }
}
