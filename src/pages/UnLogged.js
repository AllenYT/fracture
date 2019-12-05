import React, {Component} from 'react'
import {Menu} from 'semantic-ui-react'
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import LoginPanel from '../panels/LoginPanel'
import '../css/unLogged.css'

class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const {activeItem} = this.state;
        return (

            <Router>
                <div id="header">
                    <Menu stackable>
                        <Menu.Item as={Link} to='/' name='home'>
                            DeepLN数据库管理系统
                        </Menu.Item>
                    </Menu>
                </div>
                
                <div id="content">
                    <Route exact path="/" component={LoginPanel}/>
                </div>

                <div className="ui inverted vertical footer segment">
                    <div className="ui container">
                        Made with &#9829; by Sihang Chen.
                    </div>
                </div>


            </Router>
        )
    }
}

export default Login;