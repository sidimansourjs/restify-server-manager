"use strict";
const 
	logger = require("bunyan"),
	restify = require("restify")
	;

class RestifyServerManager {

	constructor(config){
		this.config = config;
		this.server
	}
	
	createServer(){
		
		// PRE handlers
		server.pre(restify.pre.sanitizePath());
		server.pre(versioningMiddleware(getExceptedRoutes()));
	}
	
	startServer(){
	 return server.listen(config.server.port, function () {
       console.log(config.server.protocol + " Server listening on port: " + config.server.port);
     });
	}
	
	stopServer(){
		this.server.close();
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

var getExceptedRoutes = function getExceptedRoutes(){
      let except      = [];

      return except;
    }


/**
 * @private
 * @memberOf ServerSetup
 * Returns a configuration object for restify server start up based on config
 * @returns {Object} Returns a server properties object.
 */
var createServerPropObject = function createServerPropObject (config, name, version) {
  // base object for any of the 2 allowed protocols
  var oServerProp = {
		name: name,
		version: version,
	formatters: getJsonFormaters()
  };

  // set up certs if HTTPS server
  if(config.server.protocol === "HTTPS"){
	let fs = require("fs");
	//Adding certs for secure server
		if (config.server.tsl.cert)
		  oServerProp.certificate = fs.readFileSync(config.server.tsl.cert);
		if (config.tsl.key)
		  oServerProp.key = fs.readFileSync(config.server.tsl.key);
  }

  // if logging enabled, create a new logger instance
  if(config.log.enabled === true){
	oServerProp.log = tracer;
  }

  if(config.log.enabled === true){
	oServerProp.log.info('Server started with log level %s', config.log.level);
  }

  return oServerProp;
}
