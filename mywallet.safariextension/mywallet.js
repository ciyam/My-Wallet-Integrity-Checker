
function doVerification(document) {
    console.log('Running My Wallet verifier\n');

    var baseURL = window.location.protocol + '//' + window.location.host + '/Resources/wallet/';
    var githubURL = "https://raw.github.com/zootreeves/blockchain.info/master/";
        
    function abort(message) {
        alert(message);
        alert('*** Serious Error - Javascript inconsistencies found. Maybe malicious - Do not Login! Please contact support@pi.uk.com');
      
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
            abort('Inline javascript found ' + jsattr[0].getAttribute(jsattrs[i]));
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
                        
                         console.log('Verified ' + filename);
                    });
                });
            }();
        }
    }
}

if ((window.location.host == "blockchain.info" || window.location.host == "www.blockchain.info") && window.location.pathname.indexOf("/wallet") != -1) {
   doVerification(document);
}
