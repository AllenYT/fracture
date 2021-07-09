import React, { Component } from 'react'
import {Header, Icon} from 'semantic-ui-react'
import axios from 'axios'

const style={
    textAlign:'center',
    marginTop:'20%',
};

class StartReviewsPanel extends Component {
    constructor(props){
        super(props)
        this.state={
            isLoggedIn: false,
            name: localStorage.realname
        }
        this.config = JSON.parse(localStorage.getItem('config'))
    }

    componentWillMount() {
        const token = localStorage.getItem('token');
        if (token !== null) {
          console.log(token);
          const headers = {
            'Authorization': 'Bearer '.concat(token)
          };
    
          axios.get(this.config.user.get_session, {headers})
            .then((response) => {
              console.log(response.data.status);
              if (response.data.status === 'okay') {
                this.setState({isLoggedIn: true});
              } else if (response.data.status === 'expires') {
                localStorage.clear();
                this.setState({expiration: true});
              } else {
                localStorage.clear();
              }
            })
            .catch((error) => {
              console.log("ERRRRROR", error);
            })
        }
      }

    render() {
        if(this.state.isLoggedIn && localStorage.realname=="1级用户"){
            return (
                <div style={style}>
                    <Icon name='user secret' color='teal' size='huge'></Icon>
                    <Header as='h1' color='teal'>您的权限不够，请联系内部管理员</Header> 
                </div>
            )
        }
        else{
            return (
                <div style={style}>
                    <Icon name='user secret' color='teal' size='huge'></Icon>
                    <Header as='h1' color='teal'>请先登录</Header> 
                </div>
            )
        }
    }
}

export default StartReviewsPanel
