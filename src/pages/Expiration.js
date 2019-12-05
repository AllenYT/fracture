import React, {Component} from 'react'
import {Menu} from 'semantic-ui-react'
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import ExpirationPanel from '../panels/ExpirationPanel'

class Expiration extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const {activeItem} = this.state;
        return (

            <Router>
                <div>
                    <Menu stackable>
                        <Menu.Item as={Link} to='/' name='home'>
                            DeepLN数据库管理系统
                        </Menu.Item>
                    </Menu>
                    <Route exact path="/" component={ExpirationPanel} /> 
                </div>



            </Router>
        )
    }
}

export default Expiration;