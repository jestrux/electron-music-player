const getColors = require('get-image-colors');

self.onmessage = function(e){
	var image = e.data.image;
    var mime = e.data.mime;
    self.postMessage(e.data);
    // getColors(image, mime).then(function(colors){
    //     self.postMessage({colors: color});
    // });
}