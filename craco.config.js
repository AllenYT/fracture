const CracoVtkPlugin = require('craco-vtk')

module.exports = {
  plugins: [
    {
      plugin: {
        overrideWebpackConfig: ({ webpackConfig }) => {
          //   const fileLoader = getLoader(webpackConfig.module.rules, (rule) => loaderNameMatches(rule, 'file-loader'))
          //   fileLoader.exclude.push(lessExtension)

          const mjsRule = {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto',
          }

          const rules = webpackConfig.module.rules
          rules.push(mjsRule)

          return webpackConfig
        },
      },
    },
    {
      plugin: CracoVtkPlugin(),
    },
  ],
}
