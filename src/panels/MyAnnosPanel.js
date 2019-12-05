import React, { Component } from 'react'
import {Table, Button, Icon, Grid, Tab, Header} from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import '../css/annosPanel.css'
import MyAnnosTable from '../components/MyAnnosTable'
// import {withRouter, BrowserRouter as Router, Route, Link} from "react-router-dom"

const style = {
  textAlign: 'center',
  marginTop: '300px'
}

class MyAnnosPanel extends Component {
    constructor(props){
        super(props)
        this.state={}

        this.handleLinkClick=this
        .handleLinkClick
        .bind(this)
    }

    handleLinkClick() {
        window.location.href='/'
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

        else {
          const panes = [
              { menuItem: '未提交', render: () => <Tab.Pane><MyAnnosTable status={0} /></Tab.Pane> },
              // { menuItem: '未审核', render: () => <Tab.Pane><MyAnnosTable status={1} /></Tab.Pane> },
              { menuItem: '已提交', render: () => <Tab.Pane><MyAnnosTable status={1} /></Tab.Pane> }
              // { menuItem: '已审核', render: () => <Tab.Pane><MyAnnosTable status={2} /></Tab.Pane> },
            ]
            return(

                <div id='my-annos'>
                    <Tab menu={{ borderless: true, inverted: true, attached: false, tabular: false }} panes={panes} id="the-tab" />
                </div>
            )
        }

    }

}

export default MyAnnosPanel
