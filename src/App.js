import React, { Component } from 'react'
import Main from './pages/Main.js'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'

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
    return <Main />
  }
}

export default App
