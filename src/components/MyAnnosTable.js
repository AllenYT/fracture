import React, { Component } from 'react'
import {Table, Button} from 'semantic-ui-react'
import '../css/myAnnosTable.css'
import axios from 'axios'
import qs from 'qs'

const config = require('../config.json')
const draftConfig = config.draft


export class MyAnnosTable extends Component {

    constructor(props) {
        super(props)
        this.state = {
            content: []
        }
        this.getAnnos = this.getAnnos.bind(this)
        this.timestampToDate = this.timestampToDate.bind(this)
        this.handleLinkClick = this.handleLinkClick.bind(this)
    }

    getAnnos() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            status: this.props.status
        }
        axios.post(draftConfig.getMyAnnos, qs.stringify(params), { headers })
        .then(res => {
            if (res.data.status === 'okay') {
                const content = res.data.allDrafts
                this.setState({content: content})
            }
        })
        .catch(err => {
            console.log('err: ' + err)
        })
    }

    handleLinkClick(event) {
        const link = '/case/' + event.currentTarget.dataset.id + '/' + localStorage.getItem('username')
        window.location.href = link
    }


    componentDidMount() {
        this.getAnnos()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.status !== this.props.status) {
            this.getAnnos()
        }
    }

    pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    timestampToDate(timestamp) {
        const date = new Date(timestamp * 1000)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hour = this.pad(date.getHours(), 2)
        const minute = this.pad(date.getMinutes(), 2)
        const second = this.pad(date.getSeconds(), 2)
        const ret = year + '年' + month + '月' + day + '日 ' + hour + ':' + minute + ':' + second
        return ret
    }



    render() {
        const content = this.state.content
        return (
            <div id="annos-table">
                <Table celled inverted fixed>
                <Table.Header>
                <Table.Row>
                    <Table.HeaderCell>检查编号</Table.HeaderCell>
                    <Table.HeaderCell>最后一次修改时间</Table.HeaderCell>
                    <Table.HeaderCell>前往</Table.HeaderCell>
                </Table.Row>
                </Table.Header>

                <Table.Body>

                    {content.map((value, index) => {
                        return (
                            <Table.Row key={index}>
                                <Table.Cell>{value.caseId}</Table.Cell>
                                <Table.Cell>{this.timestampToDate(value.lastActive)}</Table.Cell>
                                <Table.Cell><Button
                                        icon='right arrow'
                                        className='ui green inverted button'
                                        data-id={value.caseId}
                                        onClick={this.handleLinkClick}
                                        >
                                    </Button></Table.Cell>
                            </Table.Row>
                        )
                    })}


                </Table.Body>
            </Table>
            </div>
        )
    }
}

export default MyAnnosTable
