likefm.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ likefm.showFirefoxContextMenu(e); }, false);
};

likefm.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-likefm").hidden = gContextMenu.onImage;
};

window.addEventListener("load", likefm.onFirefoxLoad, false);