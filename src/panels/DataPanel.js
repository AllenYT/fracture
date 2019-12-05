import React, {Component} from 'react'
import {Pagination, Input, Grid, Checkbox, Button} from 'semantic-ui-react'
import MainList from '../components/MainList'
import Statistics from '../components/Statistics'
import '../css/dataPanel.css'
import axios from 'axios';
import qs from 'qs'
import {withRouter} from 'react-router-dom'

const config = require('../config.json')
const recordConfig = config.record

class DataPanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
            checked: false,
            activePage: 1,
            totalPage: 1,
            pidKeyword: '',
            dateKeyword: '',
        }
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

        axios.post(recordConfig.getTotalPages, qs.stringify(params), {headers}).then((response) => {
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

    //导出caseid传入下载界面
    // exportCaseId(){
    //     console.log('cid',this.props.storecid)
    //     this.nextPath('/download')
    // }

    render() {

        const {activePage} = this.state
        const isChecked = this.state.checked
        let type = "pid"

        if (isChecked) {
            type = "date"
        }

        return (
            <div>

                <Grid>
                    <Grid.Row className="banner">
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12}>
                            <Statistics/>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    {/* <Grid.Row className="data-content">
                        <Grid.Column width={2}></Grid.Column>

                        <Grid.Column width={12}>

                            <div id="container">
                                <div className="searchBar">
                                    <Input
                                        name="pid"
                                        value={this.state.pidKeyword}
                                        onChange={this.handleInputChange}
                                        id="patient-search"
                                        icon='user'
                                        iconPosition='left'
                                        placeholder="病人ID"/>

                                    <span id="type-slider"><Checkbox
                                        slider
                                        onChange={this.handleCheckbox}
                                        defaultChecked={this.state.checked}/></span>

                                    <Input
                                        name="date"
                                        value={this.state.dateKeyword}
                                        onChange={this.handleInputChange}
                                        id="date-search"
                                        icon='calendar'
                                        iconPosition='left'
                                        placeholder="检查时间"/>
                                </div>

                                <div className="patientList">
                                    <MainList 
                                        type={type}
                                        currentPage={this.state.activePage}//MainList.js 40,css in MainList.js 108
                                        pidKeyword={this.state.pidKeyword}
                                        dateKeyword={this.state.dateKeyword}/>
                                </div>
                                <div className="pagination-component">
                                    <Pagination
                                        id="pagination"
                                        onPageChange={this.handlePaginationChange}
                                        activePage={this.state.activePage}
                                        totalPages={this.state.totalPage}/>
                                </div>
                            </div>

                        </Grid.Column>

                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row> */}
                </Grid>

            </div>
        )
    }
}

export default withRouter(DataPanel)