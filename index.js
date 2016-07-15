"use strict";
const 
	logger = require("bunyan"),
	restify = require("restify"),
	errorHandler = require('express-error-handler')
	;

class RestifyServerManager {

	constructor(config){
		this.logger, this.server;
		this.versioningMiddleware 	= require("restify-versioning-middleware");
		this.config 				= mergeConfig(config);
		this.apiMonitorer 			= require('./libs/apiMonitorer'),
		this.apiJWT 	 			= require('./libs/apiJWT')
		
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
				   path: process.cwd() + this.config.logging.path +'/'+  this.config.name +'_'+ "LOG" +'.log',
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
		  
		// Error handlers
		let handleError = errorHandler({ 
			server: this.server, 
			framework: 'restify'
		})

		// Since restify error handlers take error last, and process 'uncaughtError' sends error first, you'll need another one for process exceptions. 
		// Don't pass the framework: 'restify' setting this time:
		let handleProcessError = errorHandler({	server: this.server	})
		
		// This is called when an error is accidentally thrown. Under the hood, it uses Node's domain module for error handling, which limits the
		// scope of the domain to the request / response cycle. Restify hooks up the domain for you, so you don't have to worry about binding request and response to the domain.
		this.server.on('uncaughtException', handleError);
		
		// This is required as MethodNotAllowed, VersionNotAllowed, UnsupportedMediaType and NotFound sends the response before any error handling can occur 
		// so it was stopping the process as no headers can be set when response is already sent
		this.server.on('MethodNotAllowed', (request, response, cb) => response.send(cb));
		this.server.on('NotFound', (request, response, cb) => response.send(cb));
		this.server.on('VersionNotAllowed', (request, response, cb) => response.send(cb));
		this.server.on('UnsupportedMediaType', (request, response, cb) => response.send(cb));
		

		// We should still listen for process errors and shut down if we catch them. This handler will try to let server connections drain, first,
		// and invoke your custom handlers if you have any defined.
		process.on('uncaughtException', handleProcessError);
		  
		// PRE handlers
		this.server.pre(restify.pre.sanitizePath());
		this.server.pre(this.versioningMiddleware().unless({path: this.config.exceptedRoutes}));
		
		// Set up adhoc pre handlers
		if(this.config.preHandlers.length > 0){
			this.config.preHandlers.map(
				item => itself.server.pre(item)
			)
		}
		
		
		// Uses for all routes
		this.server.use(restify.acceptParser(this.server.acceptable ));
		this.server.use(restify.queryParser());
		this.server.use(restify.bodyParser());
		this.server.use(restify.gzipResponse());
		this.server.use(restify.fullResponse());
		this.server.use(restify.requestLogger({}));
		this.server.use(noCacheMiddleware);
		
		// If security is enabled, check the token integrity in all routes but the excepted ones
		if(this.config.security.enabled){
			if(this.config.heartbeat)
				this.config.security.exceptedRoutes.push({ url: '/', methods: ['GET']  })
			this.server.pre(this.apiJWT(this.config, restify).unless({path: this.config.security.exceptedRoutes }));
			}
		
		// Set up adhoc uses
		if(this.config.uses.length > 0){
			this.config.uses.map(
				item => itself.server.use(item)
			)
		}
		
		
		//Set up heartbeat route
		if(this.config.heartbeat){
			this.server.get({ path: '/'}, function(req, res, next) {
				return next(res.json({name: itself.config.name , version: itself.config.version , date: new Date() }));
			});
		}
		
		//Set up routes
		if(this.config.routes.length > 0){
			this.config.routes.map(
				item => require(process.cwd() + item)(itself.server, restify, itself.logger, itself.config)
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
					path: process.cwd() + itself.config.logging.path +'/'+ itself.config.name +'_'+ 'AUDIT' +'.log',
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

module.exports = {
 RestifyServerManager: RestifyServerManager,
 errorHandler: errorHandler
}

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
			preHandlers: paramConf.preHandlers || [],
			uses: paramConf.uses || [],
			monitorer: {
				enabled: (paramConf.monitorer && paramConf.monitorer.enabled)?paramConf.monitorer.enabled:false,
				basepath: (paramConf.monitorer && paramConf.monitorer.basepath)?paramConf.monitorer.basepath:'http://127.0.0.1:8080',
				urlpath: (paramConf.monitorer && paramConf.monitorer.urlpath)?paramConf.monitorer.urlpath:'/api/v1/log',
			},
			formatters: paramConf.formatters || {},
			afterHooks: paramConf.afterHooks || [],
			heartbeat: paramConf.heartbeat || true,
			exceptedRoutes: paramConf.exceptedRoutes || [],
			security: {
				enabled: (paramConf.security && paramConf.security.enabled)?paramConf.security.enabled:false,
				privatekeylocation: (paramConf.security && paramConf.security.privatekeylocation)?paramConf.security.privatekeylocation:"certs/server-cert.pem",
				algorithm: (paramConf.security && paramConf.security.algorithm)?paramConf.security.algorithm:"RS256",
				exceptedRoutes: (paramConf.security && paramConf.security.exceptedRoutes)?paramConf.security.exceptedRoutes:[]				
			},
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


