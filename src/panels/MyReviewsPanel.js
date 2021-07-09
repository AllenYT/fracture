import React, { Component } from 'react'
import {Header, Icon, Tab} from 'semantic-ui-react'
import '../css/reviewsPanel.css'
import axios from 'axios'

const style={
    textAlign:'center',
    marginTop:'300px',
};


class MyReviewsPanel extends Component {
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

      if (localStorage.getItem('token') == null) {
        return (
          <div style={style}>
              <Icon name='user secret' color='teal' size='huge'></Icon>
              <Header as='h1' color='teal'>请先登录</Header>
          </div>
        )
      }

      else if (parseInt(localStorage.getItem('privilege')) < 2) {
        return (
            <div style={style}>
                <Icon name='user secret' color='teal' size='huge'></Icon>
                <Header as='h1' color='teal'>您的权限不够，请联系内部管理员</Header>
            </div>
        )
      }

      else {
          const panes = [
            { menuItem: '我的审核', render: () => <Tab.Pane>我的审核</Tab.Pane>},
            { menuItem: '可审核列表', render: () => <Tab.Pane>可审核列表</Tab.Pane>}
          ]
          return (
            <div id="my-reviews">
              <Tab menu={{ borderless: true, inverted: true, attached: false, tabular: false }} panes={panes} id="the-tab" />
            </div>
          )
      }

    }
}

export default MyReviewsPanel
