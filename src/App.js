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

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import 'aos/dist/aos.css'
import './App.css'

const preloadState = {}

const middleware = [thunk, promiseMiddleware]
// if (process.env.NODE_ENV !== 'production') {
//   middleware.push(createLogger())
// }
const store = createStore(reducer, preloadState, applyMiddleware(...middleware))
// store.dispatch(getConfigJson(process.env.PUBLIC_URL + "/config.json"))

class App extends Component {
  constructor(props) {
    super(props)
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
        <DndProvider backend={HTML5Backend}>
          <Main />
        </DndProvider>
      </Provider>
    )
  }
}

export default App
