if (typeof MyWallet == "undefined") {
    var MyWallet = {}
}

MyWallet.baseURL = '/Resources/wallet/';
MyWallet.githubURL = 'https://raw.github.com/blockchain/My-Wallet/master/';
MyWallet.extensionPrefix = 'chrome-extension://';

MyWallet.registerURIHandler = function() {
    if (navsator) {
        try {
            navigator.registerProtocolHandler("bitcoin",
                window.location.protocol + '//' + window.location.hostname + "/uri?uri=%s",
                "Blockchain.info");
        } catch(e) {
            console.log(e);
        }
    }
};

MyWallet.trim = function (str) {
    if (str == null) return null;
    return str.replace(/^\s+|\s+$/g, "");
};

MyWallet.startsWith = function (str, needle) {
    return (this.trim(str).indexOf(needle) == 0);
};

MyWallet.verify = function(script_tag) {
    var self = this;

    var src = script_tag.getAttribute('src');

    if (src == null || src.length == 0 || src == 'about:blank') {
        self.abort('Inline javascript file found');
    } else if (this.startsWith(src, this.extensionPrefix)) {
        return; //Allow user extensions
    } else {
        var func = function () {
            var filename = src.substring(src.lastIndexOf('/') + 1);

            var localFileName = self.baseURL + filename;
            var githubFileName = self.githubURL + filename;

            self.fetchResource(localFileName, function (localResponse) {
                var localLines = localResponse.split('\n');

                self.fetchResource(localFileName, function (gitHubResponse) {
                    var githubLines = gitHubResponse.split('\n');

                    if (localLines.length != githubLines.length) {
                        self.abort('Different number of lines in ' + filename + ' to the script on github');
                    }

                    for (var i = 0; i < localLines.length; ++i) {
                        if (localLines[i] != githubLines[i]) {
                            self.abort('Discrepency in ' + filename + ' line: ' + i + ' ' + localLines[i]);
                        }
                    }

                    console.log('Verified ' + filename);
                });
            });
        }();
    }
};

MyWallet.fetchResource = function(url, success) {
    var self = this;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) success(xhr.responseText);
            else self.abort('Error fetching ' + url);
        }
    }
    xhr.send();
};

MyWallet.abort = function(message) {
    if (this.error)
        return;

    alert(message);
    alert('*** Serious Error - Javascript inconsistencies found. Maybe malicious - Do not Login! Please contact support@pi.uk.com');

    document.write('');

    this.error = true;
};

MyWallet.doVerification = function (document) {
    console.log('Running My Wallet verifier\n');

    var baseURL = window.location.protocol + '//' + window.location.host + '/Resources/wallet/';
    var githubURL = "https://raw.github.com/zootreeves/blockchain.info/master/";

    var bannedTags = ["form", "iframe", "frame", "object", "applet", "embed"];

    //Check for banned tags
    for (var i in bannedTags) {
        var tags = document.getElementsByTagName(bannedTags[i]);
        if (tags.length > 0) {
            this.abort('Banned ' + bannedTags[i] + ' Found');
        };
    }

    //Check any href's for javascript:
    var hrefs = getElementsByAttribute(document, '*', 'href');
    for (var ii = 0; ii < hrefs.length; ii++) {
        var href = hrefs[ii].getAttribute('href');

        if (href == null || href.length == 0) continue;

        //Check for href="javascript:alert(banned)"
        if (this.startsWith(href, 'javascript:') || this.startsWith(href, '&{')) {
            this.abort('Illegal javascript href found ' + href);
        }
    }

    //Check for any eternal src attributes or javascript:
    var srcs = getElementsByAttribute(document, '*', 'src');
    for (var ii = 0; ii < srcs.length; ii++) {
        var src = srcs[ii].getAttribute('src');

        //Allow jQuery from google
        if (!this.startsWith(src, '/') && !this.startsWith(src, 'https://ajax.googleapis.com') && !this.startsWith(src, 'javascript:') && !this.startsWith(src, '&{') && !this.startsWith(src, 'https://www.google.com') && !this.startsWith(src, this.extensionPrefix) && !this.startsWith(src, 'https://www.youtube.com/')) {
            this.abort('Unknown src attribute ' + src);
        }
    }

    var jsattrs = ["onmousedown", "onmouseup", "onclick", "ondblclick", "onmouseover", "onmouseout", "onmousemove", "onkeydown", "onkeyup", "onkeypress", "onfocus", "onblur", "onload", "onunload", "onabort", "onerror", "onsubmit", "onreset", "onchange", "onselect", "oninput", "onpaint", "ontext", "onpopupShowing", "onpopupShown", "onpopupHiding", "onpopupHidden", "onclose", "oncommand", "onbroadcast", "oncommandupdate", "ondragenter", "ondragover", "ondragexit", "ondragdrop", "ondraggesture", "onresize", "onscroll", "overflow", "onoverflowchanged", "onunderflow", "onoverflowchanged", "onsubtreemodified", "onnodeinserted", "onnoderemoved", "onnoderemovedfromdocument", "onnodeinsertedintodocument", "onattrmodified", "oncharacterdatamodified"];


    for (var i in jsattrs) {
        var jsattr = getElementsByAttribute(document, '*', jsattrs[i]);

        //Check for any inline javascript
        if (jsattr.length > 0) {
            this.abort('Inline javascript found ' + jsattr[0].getAttribute(jsattrs[i]));
        };
    }

    function getElementsByAttribute(oElm, strTagName, strAttributeName) {
        var arrElements = (strTagName == "*" && document.all) ? document.all : oElm.getElementsByTagName(strTagName);
        var arrReturnElements = new Array();
        var oAttributeValue = (typeof strAttributeValue != "undefined") ? new RegExp("(^|\\s)" + strAttributeValue + "(\\s|$)") : null;
        var oCurrent;
        var oAttribute;
        for (var i = 0; i < arrElements.length; i++) {
            oCurrent = arrElements[i];
            oAttribute = oCurrent.getAttribute(strAttributeName);
            if (typeof oAttribute == "string" && oAttribute.length > 0) {
                arrReturnElements.push(oCurrent);
            }
        }
        return arrReturnElements;
    }
    var scripts = document.getElementsByTagName('script');

    for (var ii = 0; ii < scripts.length; ii++) {
        this.verify(scripts[ii]);
    }
}

MyWallet.doVerification(document);

