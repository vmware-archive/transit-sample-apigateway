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


appRouter.get("/predictions/stop/:stopId/route/:routeId", function(req, res, stopId, routeId) {
  var predictions = http.get("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId=" + stopId + "&routeTag=" + routeId).then(handleXMLResponse);

  function handleXMLResponse(response) {
    var parsedObject  = XML.parse(response.body);

    var predictions = {directions: []};

    if(!_.isObject(parsedObject.predictions) || !_.isObject(parsedObject.predictions.direction)){
      return;
    }

    var parsedDirections = parsedObject.predictions.direction;

    if (!_.isArray(parsedDirections)) {
     parsedDirections = [parsedDirections];
    }
    
    _.each(parsedDirections, function(direction) {
    if (!_.isObject(direction) || !_.isObject(direction.prediction)) {
      return;
    }

    var newDirection = {
      "title": direction["@routeTitle"] || direction["@dirTitleBecauseNoPredictions"] || direction["@title"],
      "predictions": []
    };


    if (!_.isArray(direction.prediction)) {
      direction.prediction = [direction.prediction];
    }

    _.each(direction.prediction, function(prediction) {
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

    predictions.directions.push(newDirection);
  });

   return predictions;
 }

 res.setBody(predictions);
});


module.exports = appRouter;