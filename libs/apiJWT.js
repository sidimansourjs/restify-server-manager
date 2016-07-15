"use strict";

module.exports = function(config, restify) {
  
  const 
        jwt = require('jsonwebtoken'),
        fs = require("fs"),
        privcert = fs.readFileSync(config.security.privatekeylocation),
        unless = require('express-unless')
        ;
        
  var middleware = function(req, res, next) {
      let token;

      var checkHeaders = function checkHeaders (){
        if (req.method === 'OPTIONS' && req.headers.hasOwnProperty('access-control-request-headers')) {
          req.log.debug('It is an options request, token will not be validated as there is no code execution');
          var hasAuthInAccessControl = !!~req.headers['access-control-request-headers']
                    .split(',').map( (header) => header.trim() ).indexOf('authorization');
                    
          if (hasAuthInAccessControl) return next();
        }
      }

      var checkRequest = function checkRequest (){
        if (req.headers && req.headers.authorization) {
          var parts = req.headers.authorization.split(' ');
          if (parts.length == 2) {
            var scheme = parts[0];
            var credentials = parts[1];

            if (/^Bearer$/i.test(scheme)) {
              token = credentials;
            } else {
              req.log.info('Invalid credentials: Authorization Header format is not correct');
              return next(new restify.InvalidCredentialsError("Invalid credentials: Authorization Header format is not correct"));
            }
          } else {
            req.log.info('Invalid credentials: Authorization Header format is not correct');
            return next(new restify.InvalidCredentialsError("Invalid credentials: Authorization Header format is not correct"));
          }
        }

        if (!token) {
            req.log.info('Invalid credentials: No authorization token was found');
            return next(new restify.InvalidCredentialsError("Invalid credentials: No authorization token was found"));

        }
      }


      var checkToken = function checkToken(){
        jwt.verify(token, privcert, { algorithm: "RS256" }, function(err, decoded) {
          if (err instanceof jwt.TokenExpiredError){
              req.log.info('Invalid credentials: Token expired %s', err);
              return next(new restify.InvalidCredentialsError("Invalid credentials: Token expired"));
          }else if (err) {
            req.log.info('Invalid credentials: Invalid token was found %s', err);
            return next(new restify.InvalidCredentialsError("Invalid credentials: Invalid token was found"));
          }

          req.log.debug('Token verified ok', token);
          return next();
        });
      } 

      req.log.debug('Checking request headers');
      checkHeaders();
      req.log.debug('Checking request');
      checkRequest();
      req.log.debug('Checking request token');
      checkToken();

  };

  middleware.unless = unless;

  return middleware;
};
