var LikeFMInject;
likefm.injectScripts = function (win) {
    // TODO: Inject JS script hooks if necessary and bind DOM events
    // Catch DOM events for play/stop in extension
    if (win.content.document.getElementById('LikeFMTokenAuthenticated')) {
        // Request session
        likefm.getSession(win);
    } else {
        likefm.checkSession(win);
    }
    // Check if there is a token exchange message
    if (win.content.document.location.host.indexOf("youtube.com") > -1) {
        // Check if track is already detected by YouTube
        function determineAndSendTrack(type,win) {
            if (win.content.document.getElementById("watch-description")) {
                var nodes = win.content.document.getElementById("watch-description").childNodes;
                var trackEl;
                var track = {};

                track.lsource = 'YouTube';
                track.source = 'P';
                for (var i in nodes) {
                    if (nodes[i].textContent && i == nodes.length - 2) {
                        if (nodes[i].childNodes && nodes[i].childNodes.length > 1)
                            trackEl = nodes[i].childNodes[nodes[i].childNodes.length-2];
                    }
                }

                if (trackEl && trackEl.childNodes[1].getAttribute("class") == "master-sprite music-note") {
                    var trackStr = trackEl.childNodes[3].textContent.split(" - ",2);
                    track.title = trackStr[1];
                    track.artist = trackStr[0];
                    track.type = type;
                    // Send message to background process
                    likefm.sendTrack(track);
                } else if (win.content.document.getElementById("eow-category").childNodes[0].textContent.match(/Music|Musik|Música|Musika|Musique|Glazba|Musica|Zene|Muziek|Musikk|Muzyka|Музыка|Hudba|Musiikki|Μουσική|Музика|מוסיקה|संगीत|音乐|音樂|音楽|음악/i)) { // English (both), Dansk, Deutsh, Espangnol (both), Filipino, Francais, Hrvatski, Italiano, Magyar, Nederlands, Norsk, Polski, Portugues (both), Pyccĸий, Slovenský, Suomi, Svenska, Čeština, Ελληνικά, Српски, עברית, हिन्द, 中文 (both), 日本語, 한국어
                    //query: win.content.document.getElementById("eow-title").textContent,
                    track.query = $("#eow-title",win.content.document).text();
                    track.type = type;
                    likefm.sendTrack(track);
                }
            }
        }

        // Injected functions
        LikeFMInject  = function() {
            // Comm link with content script
            trackEvent = document.createEvent('Event');
            trackEvent.initEvent('myTrackEvent', true, true);

            window['onYouTubePlayerReady'] = function(){
                document.getElementById("movie_player").addEventListener("onStateChange",'fireTrackEvent');
            };
        }

        likefm.callback = function(newState,win) {
            if (newState == 1) {
               determineAndSendTrack('touch',win);
            } else if (newState == 0) {
               determineAndSendTrack('finish',win);
            }
        };

        likefm.injectHooks(win,LikeFMInject,likefm.callback);

    } else if (win.content.document.location.host.indexOf("pandora.com") > -1) {

        LikeFMInject = function() {
            // Comm link with content script
            trackEvent = document.createEvent('Event');
            trackEvent.initEvent('myTrackEvent', true, true);

            Pandora.setEventHandler("SongPlayed", function(songData) {
                fireTrackEvent({title:songData.songName,artist:songData.artistName,type:'touch'});
            });
            Pandora.setEventHandler("SongEnded", function(songData) {
                fireTrackEvent({title:songData.songName,artist:songData.artistName,type:'finish'});
            });
        }

        likefm.callback = function(track) {
            track.lsource = 'Pandora';
            track.source = 'E';

            likefm.sendTrack(track);
        };

        likefm.injectHooks(win,LikeFMInject,likefm.callback);

    } else if (win.content.document.location.host.indexOf("meemix.com") > -1) {

        LikeFMInject = function() {
            // Comm link with content script
            trackEvent = document.createEvent('Event');
            trackEvent.initEvent('myTrackEvent', true, true);

            MeeMixPlayer.setEventHandler("SongPlaying", function(songData){
                fireTrackEvent({title:songData.title,artist:songData.artist,type:'touch'});
            });

            MeeMixPlayer.setEventHandler("SongFinishing", function(songData){
                fireTrackEvent({title:songData.title,artist:songData.artist,type:'finish'});
            });
        }

        likefm.callback = function(track) {
            track.lsource = 'Meemix.com';
            track.source = 'E';

            likefm.sendTrack(track);
        };

        likefm.injectHooks(win,LikeFMInject,likefm.callback);

    } else if (win.content.document.location.host.indexOf("grooveshark.com") > -1) {
         LikeFMInject = function() {
            // Comm link with content script
            trackEvent = document.createEvent('Event');
            trackEvent.initEvent('myTrackEvent', true, true);

            function bind() {
                try {
                window.Grooveshark.setSongStatusCallback("fireTrackEvent");
                } catch (e) {
                    setTimeout(bind,1200);
                }
            }
            bind();
        }

        likefm.callback = function(data) {
            var track = {};
            track.lsource = 'Grooveshark';
            track.source = 'P';
            if (data.status == "playing") {
               track.title = data.song.songName;
               track.artist = data.song.artistName;
               track.album = data.song.albumName;
               track.type = 'touch';
               likefm.sendTrack(track);

            } else if (data.status == "completed") {
               track.title = data.song.songName;
               track.artist = data.song.artistName;
               track.album = data.song.albumName;
               track.type = 'finish';

               likefm.sendTrack(track);
            }
        };

        likefm.injectHooks(win,LikeFMInject,likefm.callback);

    } else if (win.content.document.location.host.indexOf("earbits.com") > -1) {
		LikeFMInject = function() {
            // Comm link with content script
            trackEvent = document.createEvent('Event');
            trackEvent.initEvent('myTrackEvent', true, true);			

			$(document).ready(function(){
				
				var player = $("#player-container");

	            player.bind("onTrackChanged", function(event, artist, title){
	                fireTrackEvent({title:title,artist:artist,type:'touch'});
	            });

	            player.bind("onTrackCompleted", function(event, artist, title){
	                fireTrackEvent({title:title,artist:artist,type:'finish'});
	            });
				
			});
        }

        likefm.callback = function(track) {
            track.lsource = 'Earbits';
            track.source = 'E';

            likefm.sendTrack(track);
        };

        likefm.injectHooks(win,LikeFMInject,likefm.callback);
		
		
    }
};

likefm.displayLinkNotice = function (win) {
    if (!win.document.getElementById("LikeFMNotice")) {
        var notice = win.document.createElement('div');
        notice.setAttribute('id','LikeFMNotice');
        notice.style.position = "fixed";
        notice.style.top = 0;
        notice.style.width = "100%";
        notice.style.zIndex = "999999";
        notice.style.background = "#dfdfdf";
        notice.style.borderTop = "1px solid #f2f2f2";
        notice.style.borderBottom = "1px solid #8e8e8e";
        notice.style.fontSize = "0.9em";
        notice.style.fontFamily = "helvetica";
        notice.innerHTML = '<div style="float:left;padding:.4em" ><img style="vertical-align:bottom" src="https://like.fm/img/like_small.png" /> Like.fm for Firefox (<a id="LikeFMNoticeClose">click here to dismiss</a>)</div><div style="float:right">You have not linked an account to this extension. Songs you play will not be sent to Like.fm. <input type="button" id="link-account" value="Link my account" /></div>';
        win.document.body.insertBefore(notice,win.document.body.firstChild);
        win.document.getElementById("LikeFMNoticeClose").addEventListener("click",function() {
            notice.style.display = "none";
        },true);
        win.document.getElementById("link-account").addEventListener("click",likefm.link,true);
    }
};

likefm.injectHooks = function (win,hooks,callback) {
    function fireTrackEvent(data) {
        var hiddenDiv = document.getElementById('LikeFMComm');
        hiddenDiv.textContent = JSON.stringify(data);
        hiddenDiv.dispatchEvent(trackEvent);
    }

    // Below is in the context of content script

    // Injected script
    if (!win.content.document.getElementById("LikeFMInject")) {
        var script = win.document.createElement('script');
        script.setAttribute('id','LikeFMInject');
        script.appendChild(win.document.createTextNode('var trackEvent;' + fireTrackEvent + '('+ hooks +')();'));
        win.document.documentElement.getElementsByTagName("HEAD")[0].appendChild(script);
    }

    // Comm link medium div
    if (!win.document.getElementById("LikeFMComm")) {

        var comm = win.content.document.createElement("div");
        comm.setAttribute("id","LikeFMComm");
        comm.style.display = 'none';
        
        win.document.getElementsByTagName('body')[0].appendChild(comm);

        // Comm link with injected script
        comm.addEventListener('myTrackEvent', function() {
            var data = JSON.parse(comm.textContent);
            likefm.callback(data,win);
        },true);
    }
};