export function handleConfig(config) {
  Object.keys(config).map((key, value) => {
    Object.keys(config[key]).map((k, v) => {
      console.log('config', k)
    })
  })
}
