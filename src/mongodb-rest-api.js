/* Provides a generic rest API for accessing mongo db documents. 
   Written by: James Wright
   Date: 11/6/14
*/

var mongo = require("mongodb");
var mongoClient = mongo.MongoClient;
var _ = require("underscore");
var moment = require("moment");
var config = require("../config/config.js")

// Provided a set of query params. Converts or returns their respective values
// For example: 
// Strings: Containing numeric values "9" are converted to their numeric form
// Date Delta: Converts a query parameter matching: [+-]{count}[smhdwMQy] 
// for example: -2d would return a Date object corresponding to 2 days from 'now'
exports.processQueryValue = function(value) {
  if(value.match) {
    if(value.match(/^[-]?\d*(\.\d*)?$/)) {
      value = Number(value);
    } else if(value.match(/[+\-]\d*[smhdwMQy]/)) {
      var dir = value[0];
      var interval = value[value.length - 1];
      var quantity = value.substring(1, value.length - 1);
      if(dir === '-') { value = moment().subtract(quantity, interval).toDate(); }
      else { value = moment().add(quantity, interval).toDate(); }
    }
  } 
  
  return value;
};

// Provided an api operator and query value, returns a mongodb compliant query criteria object
exports.processQueryOperator = function(param, name, value) {
  var operator = param.substring(name.length);
  var isNot = operator.indexOf('!') > -1;
  var values = value && value.split ? value.split("|") : value, out = null;
  
  if(_.isEmpty(value)) {
    return isNot ? { $ne: null } : { $exists: true }; 
  } else {
    for(var i = 0; i < values.length; i++) {
      values[i] = exports.processQueryValue(values[i]);
    }   
    
    switch(operator.replace(/!|\(.*\)/g, '')) {
      case '>': out = { $gte: _.max(values) }; break;
      case '<': out = { $lte: _.min(values) }; break;
      case '*': out = { $text: { $search: values }}; break;
      case '~': out = { $regex: value}; break;
      case '%': out = { $mod: 
                       [ Number(param.replace(/.*%\((\d*)\).*/g, "$1")) , 
                         Number(values[0])]}; 
        break; 
      default: return isNot ? { $nin: values } : { $in: values };
    }
  }
  
  // $regex is special when using $not
  return !isNot ? out : 
          out.$regex ? { $not: new RegExp(out.$regex) } : { $not: out };
};

// Implements the advanced logic around boolean operators. AND OR and GROUPING () 
exports.processBooleanOperator = function (operator, value) {
  // TODO
};

/*
  Converts a mathmatical expression. For example:
  ($statistics.mean * $statistics.count) / 10
  into a mongo db compliant arithemtic expression. 
*/
exports.processExpression = function (param, subExps) {  
  var out = {}, tmp = null, rawExp = param.replace(/^.*(\([^)]*\s[^)]*\)).*$/, "$1");
  var exp = rawExp ? rawExp : param;
  subExps = subExps ? subExps : [];
  
  var components = exp.replace(/^\((.*\s.*)\)$|(.*)/g,'$1$2').split(' ');
  for(var i = 0; i < components.length; i++) {
      var jump = components[i].match(/^([*/+ -%]|add|div|sub|mod|mul)$/) ? 1 : 2;
      var values = [jump === 1 ? tmp : components[i], components[i + jump]];
      if(values[0].match && values[0].match(/^\$subExp/)) values[0] = 
        subExps[Number(values[0].replace(/^\$subExp(\d*)$/g, '$1'))];
      if(values[1].match && values[1].match(/^\$subExp/)) values[1] = 
        subExps[Number(values[1].replace(/^\$subExp(\d*)$/g, '$1'))];
    
      values = _.map(values, function (value) {
        if(value && value.match && value.match(/^\d*([.,]\d*)?$/)) {
          value = Number(value);
        } else if(value && value.match && value.match(/\w*[(]\$.*?[)]/)) {     
          var parts = value.replace(/^(\w*)[(](\$.*?)[)]/,'$1,$2').split(',');
          value = {};
          value['$' + parts[0]] = parts[1];
        } 
        
        return value;
      });
    
      switch(components[i + (jump - 1)]) {
        case '*': tmp = { $multiply: values }; break;
        case 'mul': tmp = { $multiply: values }; break;
        case '-': tmp = { $subtract: values }; break;
        case 'sub': tmp = { $subtract: values }; break;
        case '/': tmp = { $divide: values }; break; 
        case 'div': tmp = { $divide: values }; break;
        case 'mod': tmp = { $mod: values }; break;
        case '%': tmp = { $mod: values }; break;
        default: tmp = { $add: values };         
      }
    
      i += jump;
  }
  
  subExps.push(tmp);
  var newExp = param.replace(rawExp, '$subExp' + (subExps.length - 1));
    
  return newExp.match(/^\$subExp\d*$/g) ? tmp : exports.processExpression(newExp, subExps);
};

// Provided a request object, returns a mongodb compliant query criteria object
exports.processQueryMap = function(req) {
  var queryOut = {};
  for(var param in req.query) {
    if(param.match(/^\$/)) continue;
    var name = param, value = req.query[param];
    name = name.replace(/:\d*.*|[<>!*~%]|\(.*\)/g, '');
    
    var leftExp, expRegex = /^\{(.*)\}.*$/;
    if(param.match(/^\{.*\}/)) { leftExp = exports.processExpression(param.replace(expRegex, '$1')); }
    if(value.match(/^\{.*\}/)) { value = exports.processExpression(value.replace(expRegex, '$1')); }
    else value = exports.processQueryOperator(param, name, value);
    var existing = queryOut[name] || {};
    _.extend(existing, value);
    queryOut[name] = existing;
  }     
  
  return queryOut;
};

// Provided a request object, returns a mongodb compliant sort query object
exports.processSort = function(req) {
  var sortOut = null;
  if(req.query.$sort) {
    var sort = req.query.$sort.split(',');
    for(var i = 0; i < sort.length; i++) {
      var dir = sort[i].match(/asc$/) ? 1 : -1;
      var field = sort[i].replace(/\s(desc|asc)$/,'');
      if(!sortOut) { sortOut = {}; }
      sortOut[field] = dir;  
    }    
  }
  
  return sortOut;
};

// Endpoint used to test query map creation
exports.testQuery = function(req, res) {
  if(req.query['$group-by']) res.json(processPipeline(req));
  else res.json(exports.processQueryMap(req));
};

// Provides access to a single event instance
exports.getTypeInstance = function(req, res) {
  req.query = { _id: req.params.id };
  exports.queryType(req, res);
};

exports.saveType = function(req, res) {
  var type = req.params.type;
  console.log('Request: ', req);
  mongoClient.connect(config.production.db, function(err, db) {
    console.log('Type saved: ', type,  req.body);
    db.collection(type).insert(req.body, null, function () { 
      res.send('Query inserted');
    })
  });
};

exports.deleteTypeInstance = function(req, res) {
  mongoClient.connect(config.production.db, function(err, db) {
    db.collection(req.params.type).remove({ _id: req.params.id }, {justOne: true})
    .done(function () {
      res.send('Deleted');
    });
  });
}

// Query/Aggregation endpoint for querying mongo db collections
exports.queryType = function(req, res) {
  if(req.query['$group-by']) {
    aggregateTypeInternal(req, res);
  } else {
    queryTypeInternal(req, res);
  }
};

// Provides a generic query endpoints for querying entities
queryTypeInternal = function(req, res) {
  mongoClient.connect(config.production.db, function(err, db) {
    db.collection(req.params.type).
      find(exports.processQueryMap(req)).    
      sort(exports.processSort(req)).
      skip(Number(req.query.$skip) || 0).
      limit(Number(req.query.$limit) || 5000).
      toArray(function (err, docs) {
        res.connection.setTimeout(0);
        res.send({
          totalCount: docs ? docs.length : 0,
          member: docs
        });                                                     
      }); 
  }); 
};

// Extracts the alias from the query param using the 'as' parameter. 
// IE: getAlias('$max as Max Count') would return Max Count
exports.getAlias = function(param, value) {
  var alias = param.replace(/^\$.*\sas\s(.*)$/g, '$1');

  if(alias === param) {
    //var path = getRegexGroup(value, /\$?[^ )}]*[.]?(\w*)[ )}]?/g);    
    var path = getRegexGroup(value, /\$([^\s${}()]*)/g);   
    var paths = (path.length === 0) ? [value] : path;
    path = [];
    for(var p = 0; p < paths.length; p++) {
      var tmp = paths[p].split('.');
      path.push(tmp.length > 2 ? [tmp[tmp.length - 2], tmp[tmp.length - 1]].join('') : tmp[tmp.length - 1]);
    }
    alias = (path.length === 0 ? value : path.join('').replace(/\$/g,'')) + '-' + param.replace(/\$(\w*)/, '$1');  
  }
  return alias;
};

// Associates the aggregate functions to the grouping pipeline
exports.processAggregateFunctions = function(req, group) {
  for(var params in req.query) {
    if(!params.match(/^\$/)) continue;
    var values = req.query[params], func = null, paramList = params.split(',');
    for(var p in paramList) {
      var param = paramList[p];
      values = _.isArray(values) ? values : values.split(',');

      for(var i = 0; i < values.length; i++) {
        var value = values[i];
        var alias = exports.getAlias(param, value);

        var expRegex = /^\{(.*)\}.*$/;
        if(value.match(/^\{.*\}/)) { 
          value = exports.processExpression(value.replace(expRegex, '$1')); 
        } else { 
          value = '$' + value; 
        }

        switch(param.replace(/\$|\(.*\)|\sas\s.*$/g, '')) {
          case 'avg': func = { $avg: value }; break;
          case 'min': func = { $min: value }; break;
          case 'max': func = { $max: value }; break;
          case 'sum': func = { $sum: value }; break;
          case 'last': func = { $last: value }; break;
          case 'first': func = { $first: value }; break;
          case 'distinct': func = { $addToSet: value }; break;
          default: break;
        }

        if(func) group[alias] = func; 
      }
    }
  }
};

/* Provided a request containing a group-by with a date interval expression
   {path} interval {quantity}[smhdwMQy]
   returns a mongodb projection to reduce the resolution on the date value
   maintaining the date data type.
*/
exports.processGroupByDate = function (req, group) {
  var param = req.query['$group-by'], out = [], expOut = {}, 
      re = /^(.*)\sinterval\s(\d*)([smhdwMy])$/;
  
  if(!param) { out = null; }
  else {
    param = _.isArray(param) ? param : param.split(",");

    for(var i = 0; i < param.length; i++) {
      var v = param[i];
      if(v.match(re)) {
        var parts = v.replace(re, "$1:$2:$3").split(':');
        if(!_.isEmpty(parts)) {
          var path = '$' + parts[0], quantity = parts[1], interval = parts[2];
          var names = ['$ml', '$s', '$m', '$h', '$d', '$w', '$M', '$y'];
          var index = names.indexOf('$' + interval);
          if(interval === 'M') index--;
          else if(interval === 'w') index++;
          // $mod($m, quantity) * 60000
          // $mod($h, quantity) * 3600000
          // $h mod quantity * 3600000
          var expressions = [], exp = '';
          group[parts[0]] = path;
          index++;
          while(index-- > -1) {
            switch(names[index]) {
              case '$M':
                group.M = { $dayOfYear: path };
                exp = interval === 'M' ? '(($M - 1) mod ' + quantity + ') * 24 * 3600000' : '(($M - 1) * 24 * 3600000)';
                expressions.push(exp);
                index -= 2;
                break;
              case '$w':
                group.w = { $dayOfWeek: path };
                exp = interval === 'w' ? '(($w - 1) mod ' + quantity + ') * 24 * 3600000' : '(($w - 1) * 24 * 3600000)';
                expressions.push(exp);
                index -= 1;
                break;
              case '$d':
                group.d = { $dayOfMonth: path };
                exp = interval === 'd' ? '((($d - 1) mod ' + quantity + ') * 24 * 3600000)' : '(($d - 1) * 24 * 3600000)';
                expressions.push(exp);
                break;
              case '$h': 
                group.h = { $hour: path };
                exp = interval === 'h' ?  '($h mod ' + quantity + ') * 3600000' : '($h * 3600000)';
                expressions.push(exp);
                break;
              case '$m':
                group.m = { $minute: path };
                exp = interval === 'm' ? '($m mod ' + quantity + ') * 60000' : '($m * 60000)';
                expressions.push(exp);
                break;
              case '$s':
                group.s = { $second: path };
                exp = interval === 's' ? '($s mod ' + quantity + ') * 1000' : '($s * 1000)';
                expressions.push(exp);
                break;
              case '$ml':
                group.ml = { $millisecond: path };
                exp = interval === 'ml' ? '($ml mod ' + quantity + ')' : '$ml';
                expressions.push(exp);
                break;
            }
          }
          
          var expression = path + ' - ';
          expression += expressions.length > 1 ? '(' + expressions.join(' + ') + ')' : expressions[0];
          
          expOut[parts[0]] = exports.processExpression(expression);
          out = [{ $project: group}, { $project: expOut }]; 
        }
      }
    }
  }
  return _.isEmpty(out) ? null : out ;
};

  /*pipeline.push({ $group: { _id: { domain: "$domain", machine: "$machine" },
                           count: { $sum: 1 }, 'duration-avg': { $avg: '$parameters.OpenTimeInSeconds.Mean' },
                           'duration-min': { $min: '$parameters.OpenTimeInSeconds.Mean' }}});
  */
exports.processGroupBy = function(req, stageIndex) {
  var group = { _id: {}};
  if(stageIndex === 0 || req.query['$cnt']) { 
    // Only add count automatically to first stage
    group.count = { $sum: 1 };
  }
  
  var param = req.query['$group-by'];
  
  if(!param) { group = null; }
  else {
    param = _.isArray(param) ? param : param.split(",");

    for(var i = 0; i < param.length; i++) {
      var v = param[i];
      var re = /^.*\s(dayOfYear|dayOfMonth|dayOfWeek|year|month|week|hour|minute|second|millisecond)$/g;
      var pv = v.replace(re, '$1');
      
      if(pv !== v) {
        v = v.substring(0, v.length - (pv.length + 1));
        var dateGroupBy = {};
        dateGroupBy['$' + pv] = '$' + v;     
        group._id[v] = dateGroupBy;
      } 
      else {
        v = v.replace(/\sinterval\s.*$/, '');
        
        var expRegex = /^\{(.*)\}.*$/;
        if(v.match(/^\{.*\}/)) { group._id['exp' + i] = exports.processExpression(v.replace(expRegex, '$1')); }
        else { group._id[v.replace('.','-')] = '$' + v; }
      }
    }  

    exports.processAggregateFunctions(req, group);
  }  
  
  return group;
};

// Provided a group by criteria, constructs a projection
exports.processPostProjection =  function(groupBy, meta, req) {
  var projection = { _id: 0, count: 1 };
  // Collapse the _id
  for(var i in groupBy._id) {
    projection[i] = '$_id.' + i;
  }
  
  // Add any aggregated fields
  for(i in groupBy) {
    if(i === '_id') continue;
    projection[i] = 1;
  }
  
  // Add any defined projections
  for(var param in req.query) {
    var values = req.query[param];
    if(param.match(/^\$project/)) {
      values = values.splice ? values : values.split(',');
      for(i = 0; i < values.length; i++) {
        var value = values[i];
        var alias = exports.getAlias(param, value);
        
        var expRegex = /^\{(.*)\}.*$/;
        if(value.match(expRegex)) { value = exports.processExpression(value.replace(expRegex, '$1')); }
        if(alias === '$size') {
          value = { $size: '$' + value }
        }
        else if(value && value.match && value.match(/\w*[(]\$.*?[)]/)) {    
          // TODO Copy
          var parts = value.replace(/^(\w*)[(](\$.*?)[)]/,'$1,$2').split(',');
          value = {};
          value['$' + parts[0]] = parts[1].splice(0,1);
        } 
        projection[alias] = value;        
        meta.series.push(alias);
      }     
    }
  }
  
  return projection;
};

// Seperates an aggregation request into it's multiple pipeline stages
exports.processStages = function (req) {
  var reqs = {};
  
  for(var param in req.query) {
    var stage = Number(param.replace(/.*:(\d*)[!<>*~]*$/g, '$1')); 
    if(!stage) stage = 0;
    
    var name = param.replace(/(.*)(:\d*)/, '$1');
    var existing = reqs[stage] || { query: {}};
    existing.query[name] = req.query[param];
    reqs[stage] = existing;
  }
  
  var out = [];
  for(var s in _.keys(reqs).sort()) {
    out[Number(s)] = reqs[s];
  }
  
  return out; 
};

// Process the $unwind stage
exports.processExpand = function(req) {
  var expand = req.query.$expand, out = [];
  if(expand) {
    expand = _.isArray(expand) ? expand : expand.split(',');
    for(var i = 0; i < expand.length; i++) {
      var path = expand[i];
      out.push('$' + path);  
    }    
  }
  
  return _.isEmpty(out) ? null : {$unwind: out[0] };
}



var expRe = /^\{.*\}$/; // matches an expression which is any value surrounded with brackets
var skipLimitRe = /^\$(skip|limit|sort|project)/; // matches a skip or limit 
var pathRegex = /^\$.*/; // matches a value starting with a '$' followed by anything

function getRegexGroup(string, regex, index) {
    if(!index) index = 1; // default to the first capturing group
    var out = [], match;
    while ((match = regex.exec(string))) {
        out.push(match[index]);
    }
    return out;
}

// Provided a projection and a request. Deteremines all the
// neccessary projection paths to include based on the request query 
exports.persistProject = function(projectionIn, req) {
  for(var param in req.query) {
    if(!param.match(/^\$.*/) || param.match(skipLimitRe)) { continue; }
    var paths = req.query[param];
    
    paths = _.isArray(paths) ? paths : paths.split(',');
    for(var i in paths) {
      var path = paths[i];
      if(path.match(expRe)) {
        path = path.replace(/[{}]/,"");
        var expPaths = getRegexGroup(path, /(\$[^ })]*)/g);
        
        for(var p in expPaths) 
          { projectionIn.$project[expPaths[p].replace('$','')] = 1; }
      } else if(!path.match(/\s/g)) 
        { projectionIn.$project[path] = 1; }       
    }
  }  
  return projectionIn;
};

// Processes an aggregation pipeline one stage at a time.
processPipeline = function(req) {
  // Seperate into indvidual pipeline objects per pipeline index
  var stages = exports.processStages(req), pipeline = [], meta = {};
  for(var i = 0; i < stages.length; i++) {
    var stage = stages[i];
    
    var expand = exports.processExpand(stage);
    if(!_.isEmpty(expand)) { pipeline.push(expand); }
    
    var query = exports.processQueryMap(stage);
    if(!_.isEmpty(query)) { pipeline.push({ $match: query }); }
    
    var groupBy = exports.processGroupBy(stage, i);
    var project = exports.processGroupByDate(stage, {});
    
    if(!_.isEmpty(project)) { 
      for(var p in project) {
        var projection = exports.persistProject(project[p], req);
        pipeline.push(projection); 
      } 
    }    
    var sort = exports.processSort(stage);
    if(!_.isEmpty(sort)) { 
      pipeline.push({ $sort: sort});
    }
    
    if(!_.isEmpty(groupBy)) {
      meta = exports.chartMeta(groupBy);
      
      pipeline.push({ $group: groupBy});
      pipeline.push({ $project: exports.processPostProjection(groupBy, meta, stage)});
    }
    
    if(i === (stages.length - 1)) { 
      // Only add skip and limit to last stage
      pipeline.push({ $skip: Number(stage.query.$skip) || 0 });
      pipeline.push({ $limit: Number(stage.query.$limit) || 1000 });
    }  
  }  
  
  return [pipeline, meta];
};

exports.chartMeta = function(item) {
    var meta = { keys: [], series: [] }
    for(var field in item._id) {
      var v = item[field];
      meta.keys.push(field); 
    }
  
    for(field in item) {
      if(field == '_id') continue;
      meta.series.push(field);
    }
    
    return meta;
};

// Perform an aggregation
aggregateTypeInternal = function(req, res) {
  var pipeline = processPipeline(req);
    
  mongoClient.connect(config.production.db, function(err, db) {
    db.collection(req.params.type).
      aggregate(pipeline[0], function (err, docs) {
	res.connection.setTimeout(0);
        res.send({
          "@context": pipeline[1],
          totalCount: docs ? docs.length : 0,
          member: docs
        });
    });
  });
};
