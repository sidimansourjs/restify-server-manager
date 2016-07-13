![](sidimansour.png)
# restify-server-manager
 A module to start a [restify.js](http://restify.com) server based on configuration.   

 Includes restify error handling from [https://www.npmjs.com/package/express-error-handler](https://www.npmjs.com/package/express-error-handler)

 Adds required security headers to the JSON API and the needed uses and handlers to get a JSON API running.

 Makes use of Restify `after` event on each route to allow easy configuration for functional monitoring and Audit

 Can set up formatters, heartbeat route, logging, ... and some other features! 

## Install
```
npm install --save restify-server-manager
```

## Purpose
To provide a component that creates a restify server object based on passed configuration, and starts/stops the server on demand.


## Configuration

Config object example HTTP:

		{
	    name: name,
		  routes: ["/src/server/routes/paymentRouter"],
	    version: version,
			monitorer: {
				enabled: true,
				basepath: 'http://127.0.0.1:8089',
				urlpath: '/api/v1/logone',
			},
			logging: {
				enabled: true,
				level: "trace",
				audit: true,
				path: "/logs",
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
				protocol: HTTP,
				url: "http://127.0.0.1:8480"
			 }
  	    }

Config object example HTTPS:

		{
		    name: name,
			routes: [],
			monitorer: {
				enabled: true,
				basepath: 'http://127.0.0.1:8089',
				urlpath: '/api/v1/logone',
			},
		    version: version,
			server:
			{
				port: 8480,
				protocol: HTTPS,
				url: "https://127.0.0.1:8480",
				"tsl": {
					"key": "certs/server-key.pem",
					"cert": "certs/server-cert.pem"
				}
			 }
  	    }


## Testing
run all tests  
`npm test`

run coverage
`grunt coverage`

## Examples

Basic configuration with logging enabled.

	var ServerManager = require('restify-server-manager').RestifyServerManager;
	var _conf = {
		name: 'name',
		routes: [],
		version: '1.0.0',
		logging: {
			enabled: true,
			level: "trace",
			audit: false,
			path: "/logs",
			rotation_period: "15m",
			back_copies_count: 2
		},
		server:
		{
			port: 8480,
			protocol: 'HTTP',
			url: "http://127.0.0.1:8480"
		 }
	}

	var serverManager = new ServerManager(_conf);

	var server = serverManager.createServer();

	serverManager.startServer();

In the example above you can add the `monitorer` property to add an `after` handler to designated routes. This handler will send a formatted object with information about the route I/O as well as basic information about the status of the route call.

	monitorer: {
			enabled: true,
			basepath: 'http://127.0.0.1:8089',
			urlpath: '/api/v1/log',
		},

This after handler will send the below information to the defined final end point. In order to enable this feature you should add the `monitor`

	server.post({ path: "/payment/", version: "1.0.0", monitor: true }

Monitorer information example:

	{
	    "type" : "fatal",
	    "service" : "postpayment100",
	    "group" : "[app name] - 1.3.4",
	    "result" : "error",
	    "when" : "2016-06-22T08:10:23.000+0000",
	    "box" : "********",
	    "info" : {
	        "remoteAddress" : "************",
	        "remotePort" : 56217,
	        "req_id" : "**********",
	        "route" : "postpayment100",
	        "req" : {
	            "query" : {
					...
	            },
	            "params" : {
	                ...
	            },
	            "body" : {
	                ...
	            },
	            "route" : {
	                "path" : "/payment/",
	                "version" : "1.0.0",  
	                "monitor" : true,
	                "method" : "POST",
	                "versions" : [
	                    "2.0.0"
	                ],
	                "name" : "postpayment100"
	            },
	            "context" : {
	                ...
	            },
	            "headers" : {
	                ...
	            }
	        },
	        "res" : {
	            ...
	        },
	        "latency" : 13
	    }
	}

## Parameters

- **Server** (`server`) HTTP/S will be started based on object key values. If *HTTPS* is choosen for server start up (`tsl.key`) and (`tsl.cert`) have to be provided. Visit [Restify site](http://restify.com/#creating-a-server) for futher details.
	- **Port** (`port`) for the server to be listening at.
	- **Protocol** (`protocol`) either *HTTPS* or *HTTP*
	- **Web address** (`url`) URL that will be used for external comms, If port, it has to match (`port`)
	- **Security** (`tsl`) Object to hold secure server properties
		- **Private Key** (`key`) Private key for TSL
		- **Public Cert** (`cert`) Public cert for TSL

				"server": {
				        "port": 8480,
				        "protocol": "HTTP",
				        "url": "http://localhost:8480"
				    }

- **Api formatters** (`formatters`) Object containing Restify formatters.

		formatters: {
			'application/foo': function formatFoo(req, res, body, cb) {
			  if (body instanceof Error)
				return body.stack;

			  if (Buffer.isBuffer(body))
				return cb(null, body.toString('base64'));

			  return cb(null, util.inspect(body));
			}
		  },

- **Api version** (`version`) Versions for api start up. Each version added should have its own api configuartion in mongodb.

			"versions": ["1.0.0"]

- **Api name** (`name`) Name of the API that will be started up.

			name: 'greatAPI',

- **Api pre request handlers** (`preHandlers`) Array of middlewares to be added as on demand functions to be executed prior to route code execution.

			preHandlers: [(req, res, next) => true, constAsFunction, ....],

- **Api route uses** (`uses`) Array of middlewares to be added as on demand functions to be executed in the chain of the route code execution.

			uses: [(req, res, next)=>{next()}, constAsFunction, ....],

- **Api Heartbeat** (`heartbeat`) If `true` will create a root route (http://host:port/)

			heartbeat: true,

	The route will send basic information on request

			{
			  "code": 200,
			  "status": "success",
			  "body": {
			    "name": "UpdaterApi",
			    "version": "1.1.3",
			    "date": "2016-06-22T11:55:14.470Z"
			  }
			}

- **Api Excepted Routes** (`exceptedRoutes`) Routes to be excepted for API versioning module. More information at [https://github.com/jfromaniello/express-unless](https://github.com/jfromaniello/express-unless).

			exceptedRoutes: [new RegExp("/users")],

- **Api hooks for after event in routes** (`afterHooks`) Array of functions to be applied as After handlers to Restify routes.

			afterHooks: [require('yourmoduleafter')]

- **API Tracing/Logging** (`logging`) This section should contain the server configuration for the API logging system. [Bunyan npm module](https://www.npmjs.com/package/bunyan) has been used for logging management.
	- **Enable logging** (`enabled`) Boolean to determine if loggin service should be started or not.
	- **Trace level** (`level`) Array that contains the names of the testing models to be mocked up.
		- (`"fatal"`) (60): The service/app is going to stop or become unusable now.
		  An operator should definitely look into this soon.
		- (`"error"`) (50): Fatal for a particular request, but the service/app continues
		  servicing other requests. An operator should look at this soon(ish).
		- (`"warn"`) (40): A note on something that should probably be looked at by an
		  operator eventually.
		- (`"info"`) (30): Detail on regular operation.
		- (`"debug"`) (20): Anything else, i.e. too verbose to be included in "info" level.
		- (`"trace"`) (10): Logging from external libraries used by your app or *very*
		  detailed application logging.
	- **Audit traces** (`audit`) yes/no. If set to *yes* a new audit logger will be starting to write to file any I/O.
	- **Logs folder** (`path`) String that contains the path for the log folder.
	- **Log file rotation** (`rotation_period`) The log files will rotate to a new file when the given period has expired.
	- **Log copies to store** (`back_copies_count`) Number of log copies to be mantained by the logging service.

		    "logging": {
		        "enabled": true,
		        "level": "info",
		        "audit": "no",
		        "path": "PATH_TO_LOGS_FOLDER",
		        "rotation_period": "1d",
		        "back_copies_count": 2
		    }

- **API Routing** (`routers`) This section should contain the routes to be used by the server on start up. Ideally should not be any difference between environments and instances for this configuration.

			var payment = require('routes/payment')
		    "routes": [
		        payment
		    ]

- **API Monitorer** (`monitorer`) This section should contain the server configuration for the API logging system. [Bunyan npm module](https://www.npmjs.com/package/bunyan) has been used for logging management.
	- **Enable monitorer** (`enabled`) Boolean to determine if loggin service should be started or not.
	- **Base URL** (`basepath`) Array that contains the names of the testing models to be mocked up.
	- **URL path** (`urlpath`) yes/no. If set to *yes* a new audit logger will be starting to write to file any I/O.

		    monitorer: {
				enabled: true,
				basepath: 'http://127.0.0.1:8089',
				urlpath: '/api/v1/logone',
			},

## License
Copyright (c) 2016 Sidi Mansour Js.
Licensed under the [MIT license](LICENSE.md).
