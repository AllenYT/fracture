import React, {Component} from 'react'
import {Pagination, Input, Grid, Checkbox, Button, Icon, Header} from 'semantic-ui-react'
import MainList from '../components/MainList'
import '../css/dataPanel.css'
import axios from 'axios';
import Statistics from '../components/Statistics'
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import Info from '../components/Info'

const config = require('../config.json')
const recordConfig = config.record
const cartConfig = config.cart
const style = {
    textAlign: 'center',
    marginTop: '300px'
  }
export class SearchPanel extends Component {


    constructor(props) {
        super(props)
        this.state = {
            checked: false,
            activePage: 1,
            totalPage: 1,
            pidKeyword: '',
            dateKeyword: '',
            searchResults: true
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
        this.startDownload = this  
            .startDownload
            .bind(this)
    }

    componentDidMount() {
        this.getTotalPages()
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('pidkeyword',this.state.pidKeyword.length)
        if (prevState.pidKeyword !== this.state.pidKeyword){
            if(this.state.pidKeyword.length >= 3 || this.state.pidKeyword.length == 0){
                // console.log("call get total pages")
                this.setState({searchResults: true})
                this.getTotalPages()

            } else {
                this.setState({searchResults: false})
            }
        }
        
        if(prevState.dateKeyword !== this.state.dateKeyword){
            if(this.state.dateKeyword.length >= 4 || this.state.dateKeyword.length == 0){
                this.setState({searchResults: true})
                this.getTotalPages()
            } else {
                this.setState({searchResults: false})
            }
        }
        
        if(prevState.checked !== this.state.checked){
            // console.log('true')
            this.setState({searchResults: true})
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
            checked: !this.state.checked,
            pidKeyword: '',
            dateKeyword: ''
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

    startDownload() {
        console.log("Start downloading")
        this.setState({loading: true})
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        axios.get(cartConfig.downloadCart, { headers })
        .then(res => {
          const filename = res.data
          console.log('Filename', filename)
          window.location.href = 'http://data.deepln.deepx.machineilab.org/data/zip/' + filename
          this.setState({loading: false})
          // window.location.reload()
        })
        .catch(err => {
          console.log(err)
        })
  
      }

    render() {

        const {activePage} = this.state
        const isChecked = this.state.checked
        let type = "pid"

        if (isChecked) {
            type = "date"
        }
        let searchResults
        if (this.state.searchResults) {
            searchResults = (
                <div>
                    <div className="patientList" style={{minHeight:500}}>
                        <MainList 
                            type={type}
                            currentPage={this.state.activePage}//MainList.js 40,css in MainList.js 108
                            pidKeyword={this.state.pidKeyword}
                            dateKeyword={this.state.dateKeyword}/>
                            <div className='exportButton'>
                                <Button inverted color='blue' onClick={this.startDownload}>导出</Button>
                            </div>
                    </div>
                    
                    <div className="pagination-component">
                        <Pagination
                            id="pagination"
                            onPageChange={this.handlePaginationChange}
                            activePage={this.state.activePage}
                            totalPages={this.state.totalPage}/>
                    </div>
                </div>
            )
        } else {
            searchResults = (
                <Info type='1' />
            )
        }
        if (localStorage.getItem('token') == null) {
            return(
                <div style={style}>
                    <Icon name='user secret' color='teal' size='huge'></Icon>
                    <Header as='h1' color='teal'>请先登录</Header>
                </div>
            )
        }
        else{
            return (
                <div>

                <Grid className="banner">
                    <Grid.Row >
                            <Grid.Column width={2}></Grid.Column>
                            <Grid.Column width={12}>
                                <Statistics/>
                            </Grid.Column>
                            <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    {/* <Grid.Row className="data-content"> */}
                    <Grid.Row>
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
                                        placeholder="病人ID"
                                        disabled={this.state.checked}/>

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
                                        placeholder="检查时间"
                                        disabled={!this.state.checked}/>
                                </div>
                                <div id="show-search-content">
                                    {searchResults}
                                </div>
                                {/* <div className="patientList" style={{minHeight:500}}>
                                    <MainList 
                                        type={type}
                                        currentPage={this.state.activePage}//MainList.js 40,css in MainList.js 108
                                        pidKeyword={this.state.pidKeyword}
                                        dateKeyword={this.state.dateKeyword}/>
                                        <div className='exportButton'>
                                            <Button inverted color='blue' onClick={this.startDownload}>导出</Button>
                                        </div>
                                </div>
                                
                                <div className="pagination-component">
                                    <Pagination
                                        id="pagination"
                                        onPageChange={this.handlePaginationChange}
                                        activePage={this.state.activePage}
                                        totalPages={this.state.totalPage}/>
                                </div> */}
                            </div>

                        </Grid.Column>

                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                </Grid>
                </div>
            )
        }
        
    }
}

export default withRouter(SearchPanel)
