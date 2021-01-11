import React, { Component } from 'react'
import {Icon,Header} from 'semantic-ui-react'

class LowerAuth extends Component{
    constructor(props) {
        super(props)
    }
    render() {
        const style={
            textAlign:'center',
            marginTop:'300px',
        }
        return(
            <div style={style}>
                <Icon name='user secret' color='teal' size='huge'></Icon>
                <Header as='h1' color='teal'>您的权限不够，请联系内部管理员</Header>
            </div>
        )
    }
}
export default LowerAuth