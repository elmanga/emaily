// decides what set of credentials to return 
if (process.env.NODE_ENV === 'production') {
    // we are in production, so we return this set of keys
    module.exports = require('./prod');
} else {
    // we are in dev, so we return this set of keys
    module.exports = require('./dev');
}
