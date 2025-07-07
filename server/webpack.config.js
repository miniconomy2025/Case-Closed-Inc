import path from 'path';
import nodeExternals from 'webpack-node-externals';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default {
  target: 'node',
  mode: 'production',  
  entry: './server.js',
  output: {
    filename: 'server.js',
    path: path.resolve(process.cwd(), 'dist'),
    module: true,
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: ['.js'],  // only JS extensions
  },
  externals: [
    nodeExternals({ importType: 'module' }),
    {
        knex: 'commonjs knex'
    },

  ],
  plugins: [
  new CopyWebpackPlugin({
    patterns: [
      { from: 'migrations', to: 'migrations' }
    ]
  })
],
};
