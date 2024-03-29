var winston = require('winston');
const os = require('os');


// define the custom settings for each transport (file, console)
var options = {
  file: {
    level: 'info',
    filename: `home/ec2-user/webapp-main/combined.log`,
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: true,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
var logger = new winston.createLogger({
  format: winston.format.combine( winston.format.timestamp(),     winston.format.json(),     winston.format.printf(info => {       const hostname = os.hostname();       info.hostname = hostname;       return JSON.stringify(info);     }) ),
  transports: [
    new winston.transports.File(options.file), //transports log messages to combined.log file
    new winston.transports.Console(options.console)
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  },
};

module.exports = logger;