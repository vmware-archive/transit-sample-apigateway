
var XMLResponseParser = module.exports;


// Parser for converting routes data to JSON; maps response to an array of route objects containing
// tags and titles from the 'route' XML nodes

XMLResponseParser.routes = function parseRoutesXML(response){
    var routesResponse = XML.parse(response.body);
    
    return _.map(routesResponse.route, function() {
      return {"tag": route["@tag"], "title": route["@title"]}; 
    } 
}

XMLResponseParser.route = function handleRouteXML(response) {
    var routeResponse = XML.parse(response.body);

    var route = {stops: []};

    _.each(routeResponse.route.stop, function(stop) {
        route.stops.push({
            "tag": stop["@tag"],
            "title": stop["@title"],
            "stopId": stop["@stopId"]
        });
    });

    return route;
}

XMLResponseParser.serviceAlerts = function(response){
  var parsedObject  = XML.parse(response.body);

  var alerts ={alerts: []}

  _.map(parsedObject.item, function(item) {
    alerts.alerts.push(item)
  });;

  return alerts;
}

function ensureArray(object){
    if (!_.isArray(object)) {
        object = [object];
    }
    return object;
}

XMLResponseParser.predictions = function(response){ 
  var parsedObject  = XML.parse(response.body);
  var parsedDirections = parsedObject.predictions.direction;
  
  if(!_.isObject(parsedObject.predictions) || !_.isObject(parsedObject.predictions.direction)){
    return;
  }
  
  var predictions = { directions: [ ] };

  parsedDirections = ensureArray(parsedDirections);

  _.each(parsedDirections, function(direction) {
    if (!_.isObject(direction) || !_.isObject(direction.prediction)) {
      return;
    }

    var newDirection = {
      "title": direction["@routeTitle"] || direction["@dirTitleBecauseNoPredictions"] || direction["@title"],
      "predictions": []
    };

    direction.prediction = ensureArray(direction.prediction);

    _.each(direction.prediction, function(prediction) {
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
