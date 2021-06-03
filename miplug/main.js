/*
 * Copyright (c) 2019 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js miplug application.
 *
 * Author: Han.hui <hanhui@acoinfo.com>
 *
 */

var WebApp = require('webapp');
var Device = require('device');
var iosched = require('iosched');

/* XiaoMi plug device */
var miplug = undefined;

/* XiaoMi plug devices */
var miplugs = new Map();

/* WebApp */
var app = WebApp.createApp();

/*
 * Set static path
 */
app.use(WebApp.static('./public'));

/*
 * Select device
 */
app.post('/api/select/:devid', function(req, res) {
	if (typeof req.params.devid !== 'string') {
		res.sendStatus(400);
		return;
	} else {
		miplugRemove();
	}

	miplug = new Device();
	miplug.request(req.params.devid, function(error) {
		if (error) {
			res.sendStatus(503, error.message);
			miplug = undefined;

		} else {
			res.send();
			miplug.on('lost', miplugRemove);

			miplug.on('message', function(msg) {
				io.emit('miplug-message', msg);
			});

			miplug.send({ query: true, attrs: ['channel0'] }, function(error) {
				if (error) {
					console.error('Query MiPlug error:', error.message);
				} else {
					console.log('Query MiPlug Ok!');
				}
			}, 3);
		}
	});
});

/*
 * app start
 */
app.start();

/* Socket IO */
var io = require('socket.io')(
	app, {
		path: '/miplug',
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000,
		cookie: false
	}
);

/*
 * Client connect & disconnect
 */
io.on('connection', function(sockio) {

	sockio.on('miplug-control', function(msg) {
		if (miplug && miplug.devid) {
			console.log('Client send message:', JSON.stringify(msg));
			miplug.send(msg, function(error) {
				if (error) {
					console.error('Send message to MiPlug error:', error.message);
				}
			}, 3);
		} else {
			sockio.emit('miplug-error', { error: 'No device!' });
		}
	});

	sockio.on('miplug-list', function(result) {
		let dev = [];
		miplugs.forEach((miplug) => {
			dev.push(miplug);
		});
		result(dev);
	});
});

/*
 * Get All XiaoMi plug device
 */
Device.list(true, function(error, list) {
	if (list) {
		list.forEach(function(dev) {
			Device.info(dev.devid, function(error, info) {
				if (info && 
					info.report.name === 'plug' && info.report.vendor === 'lumi' && info.report.model === 'port') {
					miplugs.set(dev.devid, {
						devid: dev.devid, alias: dev.alias, report: info.report
					});
				}
			});
		});
	}
});

/*
 * XiaoMi plug device lost
 */
Device.on('lost', function(devid) {
	if (miplugs.has(devid)) {
		miplugs.delete(devid);
		if (miplug && miplug.devid === devid) {
			miplugRemove();
		}

		io.emit('miplug-lost', devid);
	}
});

/*
 * XiaoMi plug device join
 */
Device.on('join', function(devid, info) {
	if (info.report.name === 'plug' && info.report.vendor === 'lumi' && info.report.model === 'port') {
		var devobj = {
			devid: devid, alias: info.alias, report: info.report
		};
		miplugs.set(devid, devobj);
		io.emit('miplug-join', devobj);
	}
});

/*
 * XiaoMi plug query statistical data
 */
setInterval(function() {
	if (miplug && miplug.devid) {
		miplug.send({ query: true, attrs: [] });
	}
}, 5000);

/*
 * XiaoMi plug Remove
 */
function miplugRemove() {
	if (miplug) {
		miplug.release();
		miplug.removeAllListeners();
	}
}

/*
 * Event loop
 */
iosched.forever();
