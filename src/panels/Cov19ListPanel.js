import React, {Component} from 'react'
import { Pagination,Grid, Table,Button,Image } from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import '../css/Cov19ListPanel.css'
import src2 from '../images/cov19.jpg'

const config = require('../config.json')
const recordConfig = config.record

class Cov19ListPanel extends Component{
    constructor(props){
        super(props)
        this.state={
            //  lists:[],
            totalLists:[],
            totalPage:1,
            activePage:1
        }   
        this.handlePaginationChange = this
            .handlePaginationChange
            .bind(this)
    }
    componentDidMount(){
        this.getTotalPages()
    }
    // componentDidUpdate(prevProps, prevState) {
    //     if(prevState.activePage!==this.state.activePage){
    //         this.getTotalPages()
    //     }
    // }

    getTotalPages(){
        // console.log(this.state.totalLists)
        const params = {}
        axios.post(recordConfig.getCov19List, qs.stringify(params)).then((response) => {
            const data = response.data
            let list=[]
            console.log('total:',data)
            for(const idx in data.covidlist){
                list.push(data.covidlist[idx])
            }
            this.setState({totalLists:list,totalPage:parseInt(data.covidlist.length/10)+1})
        }).catch((error) => console.log(error))
    }

    handleLinkClick(caseId,e) {
        
        this.nextPath('/cov19Case/' + caseId)
    }

    nextPath(path) {
        this.props.history.push(path)
    }

    handlePaginationChange(e, {activePage}) {
        this.setState({activePage})
    }


    render(){
        
        let lists=[]
        for(let i=(this.state.activePage-1)*10,count=0;i<this.state.totalLists.length && count<10;i++,count++){
            lists.push(this.state.totalLists[i])
        }
        return(
            <div>
                <Grid>
                <Grid.Row className="data-content">
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12} id="cov19container">
                            <div style={{minHeight:590}}>
                            <Table celled inverted textAlign='center' fixed id="table">
                                <Table.Header id='table-header'>
                                    <Table.Row>
                                        <Table.HeaderCell>病人ID</Table.HeaderCell>
                                        <Table.HeaderCell>查看详情</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {lists.map((content, index) => {
                                        return (
                                            <Table.Row key={index}>
                                                
                                                <Table.Cell >{content}</Table.Cell>
                                                <Table.Cell>
                                                    <Button 
                                                        icon='right arrow'
                                                        className='ui green inverted button' 
                                                        onClick={this.handleLinkClick.bind(this,content)}
                                                        size='mini'
                                                        // data-id={dataset}
                                                    ></Button>
                                                </Table.Cell>
                                            </Table.Row>
                                        )
                                    })}
                                    
                                </Table.Body>
                            </Table>
                            </div>
                            <div className="pagination-component">
                                <Pagination
                                    id="pagination"
                                    onPageChange={this.handlePaginationChange}
                                    activePage={this.state.activePage}
                                    totalPages={this.state.totalPage}/>
                            </div>
                            </Grid.Column>
                            
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row> 
                </Grid>
            </div>
        )
    }
}

export default Cov19ListPanel