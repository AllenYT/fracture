import React, { Component } from 'react'
import Main from './pages/Main.js'
import AOS from 'aos'
import { Provider } from 'react-redux'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import promiseMiddleware from 'redux-promise'
import { createLogger } from 'redux-logger'
import reducer from './reducers'
import { getConfigJson } from './actions'
import 'aos/dist/aos.css'
import './App.css'

const preloadState = {
}

const middleware = [thunk, promiseMiddleware]
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger())
}
const store = createStore(reducer, preloadState, applyMiddleware(...middleware))
// store.dispatch(getConfigJson(process.env.PUBLIC_URL + "/config.json"))

class App extends Component {
  constructor(props) {
    super(props)
  }
  componentWillMount() {
    // console.timeEnd("d")
    // const promise = new Promise((resolve, reject) =>{axios.get(process.env.PUBLIC_URL + "/config.json").then((res) => {
    //     const config = res.data
    //     console.log('config', config)
    //     localStorage.setItem('config', JSON.stringify(config))
    //     resolve(true)
    //   }, reject)
    // })
    // await promise
  }
  componentDidMount() {
    AOS.init({})
  }
  render() {
    // if (this.state.isLoggedIn) {
    //   return (
    //     <Main />
    //   );
    // } else if (this.state.expiration) {
    //   localStorage.clear();
    //   return (
    //     <Expiration />
    //   );
    // } else {
    //   return (
    //     <UnLogged />
    //   )
    // }
    return (
      <Provider store={store}>
        <Main />
      </Provider>
    )
  }
}

export default App
