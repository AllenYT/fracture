import React, {Component} from 'react';
import './App.css';
import UnLogged from './pages/UnLogged.js'
import Expiration from './pages/Expiration.js'
import Main from './pages/Main.js'
import axios from 'axios';


const config = require('./config.json')
const userConfig = config.user

class App extends Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   isLoggedIn: false,
    //   expiration: false
    // }
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
      <Main />
    )
  }



}

export default App;
