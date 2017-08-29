var id3 = require('node-id3');

self.onmessage = function(e){
	var file = e.data.file;
    var albumArt = e.data.albumArt;
	var song_path = file.path;
    var song = {};
    song.path = song_path;
    song.title = file.name || "Unknown song";
    
    if(albumArt){
        song.imageMime = albumArt.large.type;
        song.artwork = albumArt.large.path;
    }

    var tags = id3.read(song_path);

    if(tags){
        song.title = tags.title;
        song.artist = tags.artist;
        song.album = tags.album;
        song.year = tags.year;

        if(!albumArt){
            var pic = tags.image;
            if(pic && pic.imageBuffer && pic.imageBuffer.length && pic.mime){
                // pic.mime = pic.mime || "png";
                song.imageMime = pic.mime;
                song.artwork = 'data:image/'+pic.mime+';base64,';
                song.artwork += pic.imageBuffer.toString('base64');
            }
        }
    }    
    
    postMessage({song: song});
}