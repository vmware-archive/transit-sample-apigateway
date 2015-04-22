var Router = require("Router");
var http = require("http")();
var _ = require("lodash");
var XML = require('XML');
var appRouter = new Router();

appRouter.get("/routes", function(req, res) {
  var routes = http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=ttc").then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    return _.map(parsedObject.route, function(route) {
      return {"tag": route["@tag"], "title": route["@title"]};
    });;
  }

  res.setBody(routes);
});

appRouter.get("/service_alerts", function(req, res) {
  var routes = http.get("http://www.ttc.ca/RSS/Service_Alerts/index.rss").then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    var alerts ={alerts: []}

    _.map(parsedObject.item, function(item) {
      alerts.alerts.push(item)
    });;

    return alerts;
  }

  res.setBody(routes);
});

appRouter.get("/routes/:id", function(req, res, id) {
  var routes = http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + id).then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    var route = {stops: []};
  
    _.each(parsedObject.route.stop, function(stop) {
      route.stops.push({
        "tag": stop["@tag"],
        "title": stop["@title"],
        "stopId": stop["@stopId"]
      });
    });

    return route;
  }

  res.setBody(routes);
});

appRouter.get("/predictions/stop/:stopId", function(req, res, stopId) {
  var predictions = http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId=" + stopId).then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    var predictions = {directions: []};
  
    _.each(parsedObject.predictions, function(prediction) {
      var newDirection = {
        "title": prediction["@dirTitleBecauseNoPredictions"] || prediction.direction["@title"],
        "predictions": []
      };

      if (newDirection.title == null) {
        console.log(JSON.stringify(prediction));
      }

      _.each(prediction.direction, function(predictions) {
        if (!_.isString(predictions)) {
          predictions = _.flatten([predictions]);
          _.each(predictions, function(prediction) {
            newDirection.predictions.push({
              "time": prediction["@epochTime"],
              "minutes": prediction["@minutes"],
              "seconds": prediction["@seconds"]
            });
          });
        }
      });

      predictions.directions.push(newDirection);
    });

    return predictions;
  }

  res.setBody(predictions);
});

appRouter.get("/predictions/stop/:stopId/route/:routeId", function(req, res, stopId, routeId) {
  var predictions = http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId=" + stopId + "&routeTag=" + routeId).then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    var predictions = {directions: []};
  
    _.each(parsedObject.predictions, function(prediction) {
      if (_.isString(prediction)) {
        return;
      }

      var newDirection = {
        "title": prediction["@routeTitle"] || prediction["@dirTitleBecauseNoPredictions"] || prediction["@title"],
        "predictions": []
      };

      if (!_.isString(prediction)) {
        _.each(prediction.prediction, function(prediction) {
            if (!prediction["@epochTime"]) {
              console.log(prediction);
            } else {
              console.log("epoch time is " + prediction["@epochTime"]);
            }
            newDirection.predictions.push({
              "time": prediction["@epochTime"],
              "minutes": prediction["@minutes"],
              "seconds": prediction["@seconds"]
            });
        });
      }

      predictions.directions.push(newDirection);
    });

    return predictions;
  }

  res.setBody(predictions);
});


module.exports = appRouter;