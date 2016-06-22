"use strict";
const 
	logger = require("bunyan"),
	restify = require("restify")
	;

class RestifyServerManager {

	constructor(config){
		this.logger, this.server;
		this.versioningMiddleware = require("restify-versioning-middleware");
		this.config = mergeConfig(config);
		this.apiMonitorer = require('./libs/apiMonitorer')
		
		if(this.config.server && this.config.server.protocol === 'HTTPS'){
			if(this.config.server.tsl){
				this.config.server.tsl = {
					key: this.config.server.tsl.key || "certs/server-key.pem",
					cert: this.config.server.tsl.cert || "certs/server-cert.pem"
				}
			}else{
				this.config.server.tsl = {
					key: "certs/server-key.pem",
					cert: "certs/server-cert.pem"
				}
			}
		}
		
		if(this.config.logging.enabled){
			
			this.logger = logger.createLogger({
				name: this.config.name + "LOG",
				streams: [{
				   type: 'rotating-file',
				   src: true,
				   path: './'+ this.config.logging.path +'/'+  this.config.name +'_'+ "LOG" +'.log',
				   period: this.config.logging.rotation_period,   // daily rotation
				   count: this.config.logging.back_copies_count  // back copies
				}],
				level: this.config.logging.level
			  })
			  
			this.config.log = this.logger;
        	this.config.log.info('Server started with log level %s', config.logging.level);
		}
	}
	
	createServer(){
	let itself = this;
      if (this.config.server.protocol === "HTTPS" || this.config.server.protocol === "HTTP") {
        this.server = restify.createServer(this.config);
        } else {
            throw new TypeError("Missing protocol or invalid value: " + this.config.server.protocol);
          }
		  
		// PRE handlers
		this.server.pre(restify.pre.sanitizePath());
		this.server.pre(this.versioningMiddleware(this.config.exceptedRoutes));
		
		// Uses for all routes
		this.server.use(restify.acceptParser(this.server.acceptable ));
		this.server.use(restify.queryParser());
		this.server.use(restify.bodyParser());
		this.server.use(restify.gzipResponse());
		this.server.use(restify.fullResponse());
		this.server.use(restify.requestLogger({}));
		this.server.use(noCacheMiddleware);
		
		//Set up heartbeat route
		if(this.config.heartbeat){
			this.server.get({ path: '/'}, function(req, res, next) {
				return next(res.json({name: itself.config.name , version: itself.config.version , date: new Date() }));
			});
		}
		
		//Set up routes
		if(this.config.routes.length > 0){
			this.config.routes.map(
				item => item()
			)
		}
		
		// Set up after hooks
		if(this.config.monitorer.enabled) this.server.on('after', this.apiMonitorer(this.config));
		
		// Set up adhoc after hooks
		if(this.config.afterHooks.length > 0){
			this.config.afterHooks.map(
				item => itself.server.on('after', item(itself.config))
			)
		}
		
		// Set up Audit logger
		if(this.config.logging.audit){
			this.server.on('after', restify.auditLogger({
			   log: logger.createLogger({
				 name: itself.config.name + 'AUDIT',
				 streams: [{
					type: 'rotating-file',
					path: './'+ itself.config.logging.path +'/'+ itself.config.name +'_'+ 'AUDIT' +'.log',
					period: itself.config.logging.rotation_period,   // daily rotation
					count: itself.config.logging.back_copies_count  // back copies
				}]
			   })
			  }));			
		}

		return this.server;		
	}
	
	startServer(){
	 let itself = this;
	 return this.server.listen(this.config.server.port, function () {
       console.log(itself.config.server.protocol + " Server listening on port: " + itself.config.server.port);
     });
	}
	
	stopServer(){
	 return this.server.close();
	}
}

module.exports = RestifyServerManager;

/**
 * @private
 * @memberOf ServerSetup
 * Applies API global headers to avoid caching
 * @returns {Void}
 */
var noCacheMiddleware = function noCacheMiddleware(req, res, next) {
	res.header("Cache-Control", "no-cache, no-store, must-revalidate");
	res.header("Pragma", "no-cache");
	res.header("Expires", -1);
	res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	res.header("X-Content-Type-Options", "no sniff");
	next();
}

var mergeConfig = function (config) {
	 let paramConf = config || {};
     let _conf =  {
		    name: paramConf.name || 'Default',
		    version: paramConf.version || '1.0.0',
			monitorer: {
				enabled: (paramConf.monitorer && paramConf.monitorer.enabled)?paramConf.monitorer.enabled:false,
				basepath: (paramConf.monitorer && paramConf.monitorer.basepath)?paramConf.monitorer.basepath:'http://127.0.0.1:8080',
				urlpath: (paramConf.monitorer && paramConf.monitorer.urlpath)?paramConf.monitorer.urlpath:'/api/v1/log',
			},
			afterHooks: paramConf.afterHooks || [],
			heartbeat: paramConf.heartbeat || true,
			exceptedRoutes: paramConf.exceptedRoutes || [],
			routes: paramConf.routes || [],
			logging: {
				enabled: (paramConf.logging && paramConf.logging.enabled)?paramConf.logging.enabled:false,
				level: (paramConf.logging && paramConf.logging.level)?paramConf.logging.level:"info",
				audit: (paramConf.logging && paramConf.logging.audit)?paramConf.logging.audit:false,
				path: (paramConf.logging && paramConf.logging.path)?paramConf.logging.path:"logs",
				rotation_period: (paramConf.logging && paramConf.logging.rotation_period)?paramConf.logging.rotation_period:"15m",
				back_copies_count: (paramConf.logging && paramConf.logging.back_copies_count)?paramConf.logging.back_copies_count:2
			},
			server:
			{
				port: (paramConf.server && paramConf.server.port)?paramConf.server.port:8480,
				protocol: (paramConf.server && paramConf.server.protocol)?paramConf.server.protocol:'HTTP',
				url: (paramConf.server && paramConf.server.url)?paramConf.server.url:"http://0.0.0.1:8480"
			}
  	    };
	return _conf;	  
}
