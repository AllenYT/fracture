import React, {Component} from 'react'
import {Pagination, Input, Grid, Checkbox, Button} from 'semantic-ui-react'
import MainList from '../components/MainList'
import Statistics from '../components/Statistics'
import DataCockpit from '../panels/DataCockpit'
import '../css/dataPanel.css'
import axios from 'axios';
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import LowerAuth from '../components/LowerAuth'

class DataPanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
        }
        this.config = JSON.parse(localStorage.getItem('config'))
        this.handlePaginationChange = this
            .handlePaginationChange
            .bind(this)
        this.handleInputChange = this
            .handleInputChange
            .bind(this)

        this.handleCheckbox = this
            .handleCheckbox
            .bind(this)
        // this.exportCaseId = this
        //     .exportCaseId
        //     .bind(this)
    }

    componentDidMount() {
        this.getTotalPages()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.pidKeyword !== this.state.pidKeyword || prevState.dateKeyword !== this.state.dateKeyword || prevState.checked !== this.state.checked) {
            this.getTotalPages()
        }
    }

    nextPath(path) {
        this.props.history.push(path)
    }

    getTotalPages() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        let type = 'pid'
        if (this.state.checked) {
            type = 'date'
        }
        const params = {
            type: type,
            pidKeyword: this.state.pidKeyword,
            dateKeyword: this.state.dateKeyword
        }

        axios.post(this.config.record.getTotalPages, qs.stringify(params), {headers}).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                alert("错误，请联系管理员")
                window.location.href = '/'
            } else {
                const totalPage = data.count
                console.log(totalPage)
                this.setState({totalPage: totalPage})
            }
        }).catch((error) => console.log(error))

    }

    handleCheckbox(e) {
        this.setState({
            checked: !this.state.checked
        })
        this.setState({activePage: 1})
    }

    handleInputChange(e) {
        const value = e.currentTarget.value
        const name = e.currentTarget.name
        this.setState({activePage: 1})
        if (name === 'pid') {
            this.setState({pidKeyword: value})
        } else if (name === 'date') {
            this.setState({dateKeyword: value})
        }
    }

    handlePaginationChange(e, {activePage}) {
        this.setState({activePage})
    }


    render() {
        const {activePage} = this.state
        const isChecked = this.state.checked
        let type = "pid"

        if (isChecked) {
            type = "date"
        }

        return (
            localStorage.getItem('auths')!==null && JSON.parse(localStorage.getItem('auths')).indexOf("stat")>-1?
            <div className='banner'>
                <Grid>
                    <Grid.Row >
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12}>
                            <Statistics/>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    <Grid.Row >
                        <Grid.Column width={16}>
                            <DataCockpit/>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

            </div>
            :
            <LowerAuth></LowerAuth>
        )
    }
}

export default withRouter(DataPanel)