const ghpages = require('gh-pages');

ghpages.publish('dist', {}, () => console.log("The tool has been published!"));