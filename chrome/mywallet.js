if (typeof MyWallet == "undefined") {

    var MyWallet = {
        baseURL : 'https://blockchain.info/Resources/wallet/',
        githubURL : 'https://raw.github.com/blockchain/My-Wallet/master/',
        extensionPrefix : 'chrome-extension://',
        registerURIHandler: function() {
            if (navsator) {
                try {
                    navigator.registerProtocolHandler("bitcoin",
                        window.location.protocol + '//' + window.location.hostname + "/uri?uri=%s",
                        "Blockchain.info");
                } catch(e) {
                    console.log(e);
                }
            }
        },
        trim : function (str) {
            if (str == null) return null;
            return str.replace(/^\s+|\s+$/g, "");
        },
        startsWith: function (str, needle) {
            return (this.trim(str).indexOf(needle) == 0);
        },
        verify: function(script_tag) {
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
        },
        fetchResource : function(url, success) {
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
        },
        sendExtensionResponse : function(data) {
            var customEvent = document.createEvent('Event');
            customEvent.initEvent('ExtensionResponse', true, true);
            document.body.setAttribute('data-extension-response', JSON.stringify(data));
            document.body.dispatchEvent(customEvent);
        },
        call : function (request) {
            var obj = request.data;
            var self = this;

            var xhr = new XMLHttpRequest();
            xhr.open(obj.method, obj.url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    request.data.response = xhr.responseText;
                    request.data.status = xhr.status;
                    self.sendExtensionResponse(request);
                }
            }
            //Send the proper header information along with the request
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.setRequestHeader("Authorization", 'Basic ' + this.Base64.encode(obj.username + ':' + obj.password));
            xhr.send(obj.data);
        },
        abort : function(message) {
            if (this.error)
                return;

            alert(message);
            alert('*** Serious Error - Javascript inconsistencies found. Maybe malicious - Do not Login! Please contact support@pi.uk.com');

            document.write('');

            this.error = true;
        },
        Base64 : {
            _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

            encode : function (input) {

                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;

                while (i < input.length) {

                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

                }

                return output;
            }
        },
        doVerification: function (document) {
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
    };
};

//var port = chrome.extension.connect();
document.body.addEventListener('ExtensionRequest', function() {
    var txt = document.body.getAttribute('data-extension-request');
    var obj = JSON.parse(txt);
    if (obj.cmd == 'call') {
        MyWallet.call(obj);
    }
});


MyWallet.doVerification(document);

