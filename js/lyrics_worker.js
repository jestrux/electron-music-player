const scrapeIt = require("scrape-it");

self.onmessage = function(e){
	var artist = e.data.artist.toLowerCase().replace(/\s/g, "");
	var song = e.data.song.toLowerCase().replace(/\s/g, "");
	var song_path = "http://www.azlyrics.com/lyrics/"+artist+"/"+song+".html";

	scrapeIt(song_path, {
	    lyrics: ".ringtone ~ div:not(.noprint):not(.footer-wrap):not(.smt)"
	}).then(page => {
		var lyrics = page.lyrics.replace(/\n/g, "<br />");
	    postMessage({lyrics: lyrics});
	})
	.catch(err => {
		postMessage({err: err});
	});
}