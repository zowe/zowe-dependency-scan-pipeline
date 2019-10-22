const metricsService = require('../services/metrics.service');

const get = function(req, res){
    res.send(metricsService.get(req.params._id));
}

const getAll = function(req, res){
    const data = metricsService.getAll()
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.end(data);
}

module.exports = {
    get,
    getAll
};