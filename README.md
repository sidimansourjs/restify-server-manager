![](sidimansour.png)
# restify-server-manager
 A module to start a [restify.js](http://restify.com) server based on configuration.   


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
			routes: [],
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


## License
Copyright (c) 2016 Sidi Mansour Js.
Licensed under the [MIT license](LICENSE.md).
