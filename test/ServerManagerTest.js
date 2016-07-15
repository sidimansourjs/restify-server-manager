/*jslint node: true*/
/*globals expect:true, Promise: true, Symbol: true, describe: true, it: true, before: true, after: true*/
"use strict";

const 
	restify = require('restify'),
	unirest = require('unirest'),
	fs = require('fs'),
	ServerManager = require('../index.js').RestifyServerManager
	;
let serverManager;
let _conf = {
		    name: 'name',
			routes: [],
		    version: '1.0.0',
			monitorer: {
				enabled: true,
				basepath: 'http://127.0.0.1:8089',
				urlpath: '/api/v1/logone',
			},
			logging: {
				enabled: true,
				level: "trace",
				audit: true,
				path: "logs",
				rotation_period: "15m",
				back_copies_count: 2
			},
			formatters: {
				'application/foo': function formatFoo(req, res, body, cb) {
				  if (body instanceof Error)
					return body.stack;

				  if (Buffer.isBuffer(body))
					return cb(null, body.toString('base64'));

				  return cb(null, util.inspect(body));
				}
			  },
			server:
			{
				port: 8480,
				protocol: 'HTTP',
				url: "http://127.0.0.1:8480"
			 }
  	    }	

describe("Server Manager service", function () {
	
	//Extended timeout for slow services
    this.timeout(5000);
	
	
    it("Should create a new ServerManager instance with default configuration", function () {
        serverManager = new ServerManager();
		expect(serverManager).to.be.object;
		expect(serverManager.config).to.be.object;
		expect(serverManager.config.name).to.be.string;
		expect(serverManager.config.version).to.be.string;
		expect(serverManager.config.monitorer).to.be.object;
		expect(serverManager.config.monitorer.enabled).to.be.false;
		expect(serverManager.config.monitorer.basepath).to.be.string;
		expect(serverManager.config.monitorer.urlpath).to.be.string;
		expect(serverManager.config.afterHooks).to.be.instanceof(Array);
		expect(serverManager.config.heartbeat).to.be.true;
		expect(serverManager.config.exceptedRoutes).to.be.instanceof(Array);
		expect(serverManager.config.routes).to.be.instanceof(Array);
		expect(serverManager.config.logging).to.be.object;
		expect(serverManager.config.logging.enabled).to.be.false;
		expect(serverManager.config.logging.level).to.be.string;
		expect(serverManager.config.logging.audit).to.be.false;
		expect(serverManager.config.logging.path).to.be.string;
		expect(serverManager.config.logging.rotation_period).to.be.string;
		expect(serverManager.config.logging.back_copies_count).to.be.number;
		expect(serverManager.config.server).to.be.object;
		expect(serverManager.config.server.port).to.be.number;
		expect(serverManager.config.server.protocol).to.be.string;
		expect(serverManager.config.server.url).to.be.string;
    });
	
	it("Should create a new ServerManager instance with adhoc configuration", function () {
        serverManager = new ServerManager(_conf);
		expect(serverManager).to.be.object;
		expect(serverManager.config).to.be.object;
		expect(serverManager.config.name).to.equal(_conf.name);
		expect(serverManager.config.version).to.be.string;
		expect(serverManager.config.monitorer).to.be.object;
		expect(serverManager.config.monitorer.enabled).to.be.true;
		expect(serverManager.config.monitorer.basepath).to.equal(_conf.monitorer.basepath);
		expect(serverManager.config.monitorer.urlpath).to.equal(_conf.monitorer.urlpath);
		expect(serverManager.config.afterHooks).to.be.instanceof(Array);
		expect(serverManager.config.heartbeat).to.be.true;
		expect(serverManager.config.exceptedRoutes).to.be.instanceof(Array);
		expect(serverManager.config.routes).to.be.instanceof(Array);
		expect(serverManager.config.logging).to.be.object;
		expect(serverManager.config.logging.enabled).to.be.true;
		expect(serverManager.config.logging.level).to.equal(_conf.logging.level);
		expect(serverManager.config.logging.audit).to.be.true;
		expect(serverManager.config.logging.path).to.equal(_conf.logging.path);
		expect(serverManager.config.logging.rotation_period).to.equal(_conf.logging.rotation_period);
		expect(serverManager.config.logging.back_copies_count).to.equal(_conf.logging.back_copies_count);
		expect(serverManager.config.server).to.be.object;
		expect(serverManager.config.server.port).to.equal(_conf.server.port);
		expect(serverManager.config.server.protocol).to.equal(_conf.server.protocol);
		expect(serverManager.config.server.url).to.equal(_conf.server.url);
    });
	
	
	
});
