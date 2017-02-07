var electron = require ('electron');

electron.app.on('ready', function() {
	var mainWindow = new electron.BrowserWindow({ width: 1000, height: 800})
	mainWindow.loadURL('file://' + __dirname + '/index.html')
})
// Make dimensions variables which are exportable so they can be used in other files
// var elWidth = 600;
// var elHeight = 800;
//
// module.exports = {
//  elWidth,
//  elHeight
// }
