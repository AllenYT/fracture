/*
 * @Author: your name
 * @Date: 2021-05-31 15:36:41
 * @LastEditTime: 2021-06-02 17:30:05
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \deepln-dazhou-new\.prettierrc.js
 */
module.exports = {
  extends: ['airbnb', 'prettier', 'prettier/react'],
  'prettier.useTabs': false,
  'prettier.tabWidth': 2,
  'prettier.bracketSpacing': false,
  singleQuote: true, // 使用单引号
  semi: false,
  printWidth: 200, // 超过最大值换行
  htmlWhitespaceSensitivity: 'ignore',
  semi: false, // 结尾不用分号
  trailingComma: 'es5',
  jsxBracketSameLine: true,
}
