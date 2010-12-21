/**
 * Like.fm API Client
 */
var LikeFM = {
    version: '1.0.8-firefox',
    currentTrack: null,
    rawTrack: null,
    finishTimeout: null,
    timestamp: null,
    calculateAuthToken: function (timestamp,secret) {
        return Crypto.MD5(secret + timestamp);
    },
    calculateSignature: function (args, secret) {
        var keys = [];
        var string_to_sign = '';
        for (var key in args) {
            keys.push(key);
        }
        keys.sort();

        keys.forEach(function(key) {
            string_to_sign += key + args[key];
        });

        string_to_sign += secret;

        return Crypto.MD5(string_to_sign);
    },
    handshake: function() {
        var jQuery = $ = LikeFM.jQuery;
        
        var ts = Math.round(new Date().getTime() / 1000);
        var args = {
            "hs":"true",
            "p":"1.0",
            "c":"",
            "v":this.version,
            "u":likefm.getStringPref('name'),
            "t":ts,
            "a": this.calculateAuthToken(ts,'4c5fbddec6eea1aecedaa2ff'),
            "api_key":'ac5dbe86ac1e96c2d31f8d1d',
            "sk":likefm.getStringPref('session_key')
        };

        $.get('http://like.fm/update2/',args,function(data,code) {
            var response = data.split("\n",4);
            if (response[0] == 'OK') {
                likefm.setStringPref('s_session', response[1]);
                likefm.setStringPref('touch', response[2]);
                likefm.setStringPref('finish', response[3]);
            } else if (response[0] == 'BADAUTH') {

            }
        },'text');
    },
    sendTouchSignal: function(implicitFinish) {
        var jQuery = $ = LikeFM.jQuery;
        
        var that = this;
        setTimeout(function(){
            if (that.currentTrack && likefm.getStringPref('s_session')) {
                var track = that.currentTrack;

                var args = {
                    s:likefm.getStringPref('s_session'), // session id
                    lv:LikeFM.version // client version - Like.fm only
                };

                if (track.artist)
                    args.a = track.artist;

                if (track.title)
                    args.t = track.title;

                if (track.album)
                    args.b = track.album;

                if (track.length)
                    args.l = track.length;

                if (track.position)
                    args.n = track.position;

                if (track.mbid)
                    args.m = track.mbid;

                if (track.genre)
                    args.lg = track.genre;

                if (track.lrating)
                    args.lr = track.lrating;

                if (track.lsource)
                    args.lo = track.lsource;
                // Send Touch signal
                $.ajax({
                    url:likefm.getStringPref('touch'),
                    data:args,
                    success:function(data,textStatus) {
                        if (data == 'BADSESSION') {
                            likefm.setStringPref('name','');
                            likefm.setStringPref('session_key','');
                            likefm.setStringPref('s_session', '');
                            likefm.setStringPref('touch', '');
                            likefm.setStringPref('finish', '');
                        }
                    },
                    error: function(request,textStatus,error) {
                    },
                    type:"POST"
                });

                if (implicitFinish) {
                    if (LikeFM.finishTimeout)
                        clearTimeout(LikeFM.finishTimeout);
                    LikeFM.finishTimeout = setTimeout(function() {
                        LikeFM.sendFinishSignal();
                    },120000); // 120000 miliseconds is 2 minutes
                }
            } else {
                that.handshake();
            }
        },1000);
    },
    sendFinishSignal: function() {
        var jQuery = $ = LikeFM.jQuery;
        
        if (this.currentTrack && likefm.getStringPref('s_session')) {
            var track = this.currentTrack;

            var args = {
                s:likefm.getStringPref('s_session'), // session id
                i:LikeFM.timestamp,
                lv:LikeFM.version // client version - Like.fm only
            };

            if (track.lsource)
                args.lo = track.lsource;

            if (track.artist)
                args.a = track.artist;

            if (track.title)
                args.t = track.title;

            if (track.album)
                args.b = track.album;

            if (track.length)
                args.l = track.length;

            if (track.position)
                args.n = track.position;

            if (track.mbid)
                args.m = track.mbid;

            if (track.genre)
                args.lg = track.genre;

            if (track.lrating)
                args.lr = track.lrating;

            if (track.source)
                args.o = track.source;

            if (track.rating)
                args.r = track.rating;

            // Send Touch signal
            $.ajax({
                url:likefm.getStringPref('finish'),
                data:args,
                success:function(data,textStatus) {
                    if (data == 'BADSESSION') {
                        likefm.setStringPref('name','');
                        likefm.setStringPref('session_key','');
                        likefm.setStringPref('s_session', '');
                        likefm.setStringPref('touch', '');
                        likefm.setStringPref('finish', '');
                    }
                },
                error: function(request,textStatus,error) {
                },
                type:"POST"
            });
        } else {
            this.handshake();
        }
    },
    loadjQuery: function (context) {
        var loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
            .getService(Components.interfaces.mozIJSSubScriptLoader);
        loader.loadSubScript("chrome://likefm/content/lib/jquery-1.4.2.min.js",context);

        var jQuery = window.jQuery.noConflict(true);
            if( typeof(jQuery.fn._init) == 'undefined') { jQuery.fn._init = jQuery.fn.init; }
        this.jQuery = jQuery;
   }
};