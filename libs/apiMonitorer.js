
'use strict';


function apiMonitorer(conf) {

  const
        config      = conf,
        monitorer   =  new require('monitorer')({url: config.monitorer.basepath + config.monitorer.urlpath});
        ;

    function monitor(req, res, route, err) {
        
        if(route.spec && route.spec.monitor){

          let
                latency     = res.get('Response-Time')
                ;
          if (typeof (latency) !== 'number') {
              latency = Date.now() - req._time;
          }

            let obj = {
                remoteAddress: req.connection.remoteAddress,
                remotePort: req.connection.remotePort,
                req_id: req.getId(),
                route: route.spec.name,
                req: {
                  query: req.query,
                  params: req.params,
                  body: req.body,
                  route: req.route,
                  context: req.context,
                  headers: req.headers
                },
                res: res._body,
                err: err._body,
                latency: latency
            };

            if(req.params && req.params.password) delete req.params.password;
            if(req.body && req.body.password) delete req.body.password;

            let result  = (parseInt(res.statusCode) > 0 && parseInt(res.statusCode) < 400)?'success':'error';
            let type = (parseInt(res.statusCode) > 0 && parseInt(res.statusCode) < 400)?'info':'error';
                type = (parseInt(res.statusCode) < 499)?type:'fatal';

            monitorer.send(
              route.spec.name,
              config.name + '-' + config.version,
              result,
              obj,
              type
            )

        }

        return true;
    }

    return (monitor);
}


///-- Exports

module.exports = apiMonitorer;
