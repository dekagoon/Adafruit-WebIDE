var path = require('path'),
    Datastore = require('nedb'),
    winston = require('winston'),
    db = new Datastore({ filename: path.resolve(process.env.PWD, 'db/webide_data_store'), autoload: true }),
    exec = require('child_process').exec,
    fs = require ('fs'),
    git_helper = require('./git_helper'),
    fs_helper = require('./fs_helper'),
    request_helper = require('./request_helper'),
    config = require('../config/config');

  fs.exists || (fs.exists = path.exists);

  exports.setup_github = function(socket) {
    git_helper.set_config(function() {
      this.setup_adafruit_libraries(socket);
    });
  };

  exports.setup_adafruit_libraries = function(socket) {
    git_helper.clone_adafruit_libraries(config.adafruit.repository, config.adafruit.remote, function(cloned_libraries) {
      socket.emit("self-check-message", "Cloning remote Adafruit repository");
      //cloned_libraries is false if they already existed...if false, let's pull the latest version of the adafruit libraries
      if (!cloned_libraries) {
        git_helper.pull(config.adafruit.repository, "origin", "master", function() {
          socket.emit("self-check-message", "Adafruit repository updated");
        });
      }
    });
  };

  exports.health_check = function(ws) {
    //TODO redis to nedb
    db.findOne({type: "editor:settings"}, function(err, settings) {
        if (settings) {
          settings.offline = true;
        } else {
          settings = {offline: true};
        }
        winston.debug("getting settings", settings);
        ws.send(JSON.stringify({type: "self-check-settings", data: settings}));
    })
    winston.debug('self-check-complete');
    ws.send(JSON.stringify({type: 'self-check-complete', data: true}));
  };
