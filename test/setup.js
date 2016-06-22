/*jslint node: true*/
"use strict";
const 
    chai 			= require("chai")
	;

console.log("Environment: " + process.env.NODE_ENV);

chai.use(require("chai-as-promised"));
global.expect = chai.expect;	
	

