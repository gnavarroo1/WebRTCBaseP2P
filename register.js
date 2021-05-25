const tsNode = require('ts-node');
const tsConfigPaths = require('tsconfig-paths');
const mainTSConfig = require('./tsconfig.json');
const testTSConfig = require('./tests/tsconfig.json');

tsConfigPaths.register({
    baseUrl: 'tests/',
    paths: {
        ...mainTSConfig.compilerOptions.paths,
        ...testTSConfig.compilerOptions.paths
    }
});


tsNode.register({
    project: './tests/tsconfig.json'
});