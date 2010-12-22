var likefm = {
    callback: function(){},
    onLoad: function() {
        // initialization code
        this.initialized = true;
        LikeFM.loadjQuery(LikeFM);
        this.strings = document.getElementById("likefm-strings");
        //var appcontent = document.getElementById("appcontent");   // browser
        //if(appcontent)
        //    appcontent.addEventListener("DOMContentLoaded", likefm.onPageLoad, true);
        gBrowser.addEventListener("DOMContentLoaded", function(event) {
            if (event.originalTarget instanceof HTMLDocument) {
                var win = event.originalTarget.defaultView;
                //if (win.frameElement) {
                  // Frame within a tab was loaded. win should be the top window of
                  // the frameset. If you don't want do anything when frames/iframes
                  // are loaded in this web page, uncomment the following line:
                  // return;
                  // Find the root document:
                  //win = win.top;
                  likefm.injectScripts(win);
               // }
              }
        }, true);
    },
    onPageLoad: function(aEvent) {
     var doc = aEvent.originalTarget; // doc is document that triggered "onload" event

     // add event listener for page unload
     aEvent.originalTarget.defaultView.addEventListener("unload", function(){likefm.onPageUnload();}, true);
    },

    onPageUnload: function(aEvent) {
     // do something
    },
    setStringPref: function(key,value) {
     // Get the "extensions.likefm." branch
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                        .getService(Components.interfaces.nsIPrefService);
    prefs = prefs.getBranch("extensions.likefm.");
    prefs.setCharPref(key,value);
    },
    getStringPref: function(key) {
       // Get the "extensions.likefm." branch
        var pref;
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.likefm.");
        try{
        pref = prefs.getCharPref(key);
        } catch(e) {
            return false;
        }
        return pref;

    },
    onMenuItemCommand: function(e) {
        //var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        //                              .getService(Components.interfaces.nsIPromptService);
        //promptService.alert(window, this.strings.getString("helloMessageTitle"),
        //                            this.strings.getString("helloMessage"));
    },
    onToolbarButtonCommand: function(e) {
        // just reuse the function above.  you can change this, obviously!
        likefm.onMenuItemCommand(e);
    },
    sendTrack: function (track) {
        var jQuery = $ = LikeFM.jQuery;
        
        if (track.title) {
            // Explicit track
            LikeFM.currentTrack = track;

            if (track.type == 'touch')
            LikeFM.sendTouchSignal(false);
            else
            LikeFM.sendFinishSignal();

        } else {
            // Only report track if no report timestamp found, or track is different, or if timeout has passed for current track
            //if (!LikeFM.timestamp || track.data != LikeFM.rawTrack || (new Date().getTime() - LikeFM.timestamp) > 60000) {
            //LikeFM.timestamp = new Date().getTime();
            // Minimal control
            // var track = ...
            var args = {
            method: 'track.normalize', // Like.fm only api method
            q: track.query
            };

            $.get('http://like.fm/api/1.0/',args,function(nTrack,code) {
            if (!nTrack.error) {
            nTrack.lsource = track.lsource;
            nTrack.source = track.source;

            LikeFM.currentTrack = nTrack;

            if (track.type == 'touch') {
            LikeFM.sendTouchSignal(false);
            }
            else
            LikeFM.sendFinishSignal();

            // LikeFM.sendTouchSignal(true);
            }
            },'json');

            LikeFM.rawTrack = track;
        }
    },
    link: function (close) {
        var jQuery = $ = LikeFM.jQuery;
        
        close = (close == 'close') ? true : false;
        var token;

        try {
            token = likefm.getStringPref('token');
        } catch (e) {
            token = null;
        }

        // Link account
        var args = {
            method:'auth.getToken',
            api_key:'ac5dbe86ac1e96c2d31f8d1d'
        }
        args['api_sig'] = LikeFM.calculateSignature(args,'4c5fbddec6eea1aecedaa2ff');

        if (token) {
            var appLinkTab = window.open('https://like.fm/api/auth/?api_key=' + args['api_key'] + '&token=' + token);
            if (close) {
                window.close();
            }
        } else {
            $.get('https://like.fm/api/1.0',args,function(data,code) {
                likefm.setStringPref('token',data['token']);
                var appLinkTab = window.open('https://like.fm/api/auth/?api_key=' + args['api_key'] + '&token=' + data['token']);
                if (close) {
                    window.close();
                }
            },'json');
        }
    },
    getSession: function (win) {
        var jQuery = $ = LikeFM.jQuery;
        
        var token;

        try {
            token = likefm.getStringPref('token');
        } catch (e) {
            token = null;
        }

        // Grab session and init session
        if (token) {
            var args = {
                'method': 'auth.getSession',
                'api_key': 'ac5dbe86ac1e96c2d31f8d1d',
                'token': token
            };
            args['api_sig'] = LikeFM.calculateSignature(args,'4c5fbddec6eea1aecedaa2ff');

            // Get session with token
            $.get('https://like.fm/api/1.0',args,function(data) {
                if(data['error']) {
                    likefm.setStringPref("token","");
                }

                if (data['session']['name'] && data['session']['key']) {
                    likefm.setStringPref("name",data['session']['name']);
                    likefm.setStringPref("session_key",data['session']['key']);
                    LikeFM.handshake();
                    likefm.setStringPref("token","");
                }
            },'json');
        }
    },
    checkSession: function (win) {
        var session_key;

        try {
            session_key = likefm.getStringPref("session_key");
        } catch (e) {
            session_key = null;
        }

        if (!session_key) {
            likefm.displayLinkNotice(win);
        }
    },
    options: function() {
        var username;

        try {
            username = likefm.getStringPref("name");
        } catch (e) {
            username = null;
        }
        var label = document.getElementById("likefm-username");
        var unlinkBttn = document.getElementById("unlinkAccountBttn");
        var createBttn = document.getElementById("createAccountBttn");
        var linkBttn = document.getElementById("linkAccountBttn");

        if (!username) {
            label.value = "No Like.fm account linked.";
            createBttn.style.display = "block";
            unlinkBttn.style.display = "none";
            linkBttn.style.display = "block";
        } else {
            label.value = "Linked to username: " + username;
            unlinkBttn.style.display = "block";
            linkBttn.style.display = "none";
            createBttn.style.display = "none";
        }
    },
    unlinkAccount: function() {
        likefm.setStringPref('name','');
        likefm.setStringPref('session_key','');
        likefm.setStringPref('s_session', '');
        likefm.setStringPref('touch', '');
        likefm.setStringPref('finish', '');

        // Reload options window js
        this.options();
    }
};
//function clearTrack(){
//    //LikeFM.currentTrack = null;
//    //LikeFM.rawTrack = null;
//}

window.addEventListener("load", likefm.onLoad, false);
