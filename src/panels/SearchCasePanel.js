import React, {Component} from 'react'
import {Pagination, Input, Grid, Checkbox, Button, Icon, Header, Dropdown} from 'semantic-ui-react'
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
const subsetConfig=config.subset
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
            searchResults: true,
            queue:[],
            chooseQueue:'all'
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
        this.getQueue = this
            .getQueue
            .bind(this)
    }

    componentDidMount() {
        this.getTotalPages()
        this.getQueue()
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
        if(prevState.chooseQueue !== this.state.chooseQueue){
            this.getTotalPages()
        }

        if(prevState.checked !== this.state.checked){
            // console.log('true')
            this.setState({searchResults: true})
            this.getTotalPages()
        }
    }
    getQueue(){
        const params={
            username:localStorage.getItem('username')
        }
        axios.post(subsetConfig.getQueue, qs.stringify(params)).then(res => {
            let queue=[{key:'all',value:'all',text:'不限队列'}]
            for(let i=0;i<res.data.length;i++){
                let item ={key:res.data[i],value:res.data[i],text:res.data[i]}
                queue.push(item)
            }
            this.setState({queue:queue})
        }).catch(err => {
            console.log(err)
        })
    }

    nextPath(path) {
        this.props.history.push(path)
    }

    getTotalPages() {
        if(this.state.chooseQueue==='all'){
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
                    // console.log(totalPage)
                    this.setState({totalPage: totalPage})
                }
            }).catch((error) => console.log(error))
        }
        else{
            let type = 'pid'
            if (this.state.checked) {
                type = 'date'
            }
            const params = {
                type: type,
                pidKeyword: this.state.pidKeyword,
                dateKeyword: this.state.dateKeyword,
                username:localStorage.getItem('username'),
                subsetName:this.state.chooseQueue
            }
            axios.post(recordConfig.getTotalPagesForSubset, qs.stringify(params)).then((response) => {
                const data = response.data
                const totalPage = data.count
                console.log('totalPage',totalPage)
                this.setState({totalPage: totalPage})
                
            }).catch((error) => console.log(error))
        }

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

    getQueueIds(e){
        let text=e.currentTarget.innerHTML.split('>')[1].split('<')[0]
        console.log('text',text)
        if(text==='不限队列'){
            this.setState({chooseQueue:'all'})
        }
        else{
            this.setState({chooseQueue:text})
        }   
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
                            dateKeyword={this.state.dateKeyword}
                            subsetName={this.state.chooseQueue}/>
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
                    {/* <Grid.Row>
                            <Grid.Column width={2}></Grid.Column>
                            <Grid.Column width={12}>
                                <Statistics/>
                            </Grid.Column>
                            <Grid.Column width={2}></Grid.Column>
                    </Grid.Row> */}
                    <Grid.Row >
                            <Grid.Column width={2}></Grid.Column>
                            <Grid.Column width={12} id='queuestyle'>
                                <Grid>
                                    <Grid.Row>

                                    </Grid.Row>
                                    <Grid.Row>
                                        <Dropdown id='queueDropdown' placeholder='请选择队列' search  selection options={this.state.queue} onChange={this.getQueueIds.bind(this)}></Dropdown>
                                    </Grid.Row>
                                    {/* <Grid.Row>
                                        {this.state.queue.map((content,index)=>{
                                            return(
                                                <Grid.Column stretched>
                                                    <Button inverted color='green'>{content}</Button>
                                                </Grid.Column>
                                            )
                                        })}
                                    </Grid.Row> */}
                                    <Grid.Row>
                                        
                                    </Grid.Row>
                                </Grid>
                                
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
