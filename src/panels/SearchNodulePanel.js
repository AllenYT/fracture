import React, {Component} from 'react'
import { Pagination,Label,Grid, Table,Header, Icon,Button,Input } from 'semantic-ui-react'
import MainList from '../components/MainList'
import axios from 'axios'
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import '../css/searchnodulePanel.css'
import { isType } from '@babel/types'

const config = require('../config.json')
const recordConfig = config.record
const draftConfig = config.draft

let panels=[]//labels赋值
let idx=0//labels内部索引
let nums={'高危':0,'低危':0,'钙化':0,'毛刺':0,'分叶':0,'实性':0,'diameter':0}//限制labels数量
let diaMeters=-1//保留直径所在labels位置

export class SearchNodulePanel extends Component {
    constructor(props){
        super(props)
        this.state={
            checked: false,
            totalPage: 1,
            // diameterLeftKeyword: '',
            // diameterRightKeyword:'',
            labels:[],//标签显示
            lists:[],//数据显示

            malignancy: -1,
            calcification: -1,
            spiculation: -1,
            lobulation:-1,
            texture:-1,
            totalPage: 1,//全部页面
            activePage:'1',
            // volumeStart:-1,
            // volumeEnd:-1,
            diameterStart:0,
            diameterEnd:5
        }
        this.handleLabels = this
            .handleLabels
            .bind(this)
        this.handlePaginationChange = this
            .handlePaginationChange
            .bind(this)
        // this.handleLinkClick=this
        //     .handleLinkClick
        //     .bind(this)
        // this.handleLabelsIcon = this
        //     .handleLabelsIcon
        //     .bind(this)
        this.handleInputChange=this
            .handleInputChange
            .bind(this)
    }

    componentDidMount() {
        panels=[]//labels赋值
        idx=0//labels内部索引
        nums={'高危':0,'低危':0,'钙化':0,'毛刺':0,'分叶':0,'实性':0,'diameter':0}//限制labels数量
        diaMeters=-1//保留直径所在labels位置
        this.getTotalPages()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.diameterStart !== this.state.diameterStart || prevState.diameterEnd !== this.state.diameterEnd ||
            prevState.labels != this.state.labels) {
            this.getTotalPages()
        }
        if(prevState.malignancy !== this.state.malignancy || prevState.calcification !== this.state.calcification ||prevState.spiculation != this.state.spiculation
            ||prevState.lobulation !== this.state.lobulation||prevState.texture !== this.state.texture){
                this.getTotalPages()
        }
        if(prevState.activePage!==this.state.activePage){
            this.getAtPageIfo()
        }
    }
    // shouldComponentUpdate(nextProps, nextState){
    //     if (nextState.diameterLeftKeyword !== this.state.diameterLeftKeyword || nextState.diameterRightKeyword !== nextState.diameterRightKeyword ||
    //         nextState.labels != this.state.labels) {
    //         this.getTotalPages()
    //     }
    //     if(nextState.malignancy !== this.state.malignancy || nextState.calcification !== nextState.calcification ||nextState.spiculation != this.state.spiculation
    //         ||nextState.lobulation !== this.state.lobulation){
    //             this.getTotalPages()
    //     }
    //     if(nextState.activePage!==this.state.activePage){
    //         this.getAtPageIfo()
    //     }
    //     return true
    // }

    getTotalPages() {
        // const token = localStorage.getItem('token')
        // const headers = {
        //     'Authorization': 'Bearer '.concat(token)
        // }
        const params = {
            malignancy: this.state.malignancy,
            calcification: this.state.calcification,
            spiculation: this.state.spiculation,
            lobulation:this.state.lobulation,
            texture:this.state.texture,
            // volumeStart:this.state.volumeStart,
            // volumeEnd:this.state.volumeEnd,
            diameterStart:this.state.diameterStart,
            diameterEnd:this.state.diameterEnd
        }
        axios.post(recordConfig.filterNodules, qs.stringify(params)).then((response) => {
            const data = response.data
            console.log('total:',data)
            
            // if (data.status !== 'okay') {
            //     alert("错误，请联系管理员")
            //     // window.location.href = '/'
            // } else {
            //     // const totalPage = data.count
            //     console.log('data:',data)
            //     // this.setState({totalPage: totalPage})
            // }
            this.getAtPageIfo()
            this.setState({totalPage:data.pages})
        }).catch((error) => console.log(error))
    }

    getAtPageIfo(){
        const params = {
            malignancy: this.state.malignancy,
            calcification: this.state.calcification,
            spiculation: this.state.spiculation,
            lobulation:this.state.lobulation,
            texture:this.state.texture,
            page:this.state.activePage,
            // volumeStart:this.state.volumeStart,
            // volumeEnd:this.state.volumeEnd,
            diameterStart:this.state.diameterStart,
            diameterEnd:this.state.diameterEnd
        }
        
        axios.post(recordConfig.getNodulesAtPage, qs.stringify(params)).then((response) => {
            let lists=[]
            const data = response.data
            console.log('pages:',data)
            for (const idx in data){
                let sequence={'volume':0,'diameter':0,'malignancy':'','lobulation':'','spiculation':'','texture':'','calcification':'','caseId':'','noduleNo':'','status':0}
                // console()
                sequence['volume']=data[idx]['volume']===undefined? ' ':Math.floor(data[idx]['volume'] * 100) / 100
                sequence['diameter']=Math.floor(data[idx]['diameter'] * 100) / 100
                sequence['malignancy']=data[idx]['malignancy']==2?'高危 ':'低危'
                sequence['lobulation']=data[idx]['lobulation']==2?'是 ':'否'
                sequence['spiculation']=data[idx]['spiculation']==2?'是 ':'否'
                sequence['texture']=data[idx]['texture']==2?'是 ':'否'
                sequence['calcification']=data[idx]['calcification']==2?'是 ':'否'
                sequence['caseId']=data[idx]['caseId']
                sequence['noduleNo']=data[idx]['noduleNo']
                sequence['status']=data[idx]['status']
                lists.push(sequence)
                // if(idxx === 'volume'){
                //     // console.log('lists[idx][idxx]:',lists[idx][idxx])
                //     // lists[idx][idxx]=Math.floor(lists[idx][idxx] * 100) / 100
                    
                // }
            //     else if(idxx === 'diameter'){
            //         lists[idx][idxx]=Math.floor(lists[idx][idxx] * 100) / 100
            //         let value=lists[idx][idxx]
            //         lists[idx][idxx]=lists[idx]['spiculation']
            //         lists[idx]['spiculation']=value

            //     }
            //     else if(idxx==='status'){
            //         delete lists[idx][idxx]
            //     }
            //     else if(idxx==='malignancy'){
            //         lists[idx][idxx]=lists[idx][idxx]==2?'高危 ':'低危'
            //         let value=lists[idx][idxx]
            //         lists[idx][idxx]=lists[idx]['lobulation']
            //         lists[idx]['lobulation']=value
            //     }
            //     else if(idxx==='noduleNo' || idxx==='caseId'){

            //     }
            //     else{
            //         lists[idx][idxx]=lists[idx][idxx]==2?'是 ':'否'
            //     }
            // }
            // if(!('volume' in lists[idx])){
            //     lists[idx]['volume']=' '
            // }
            }
            console.log('lists1:',lists)
            this.setState({lists:lists})
        }).catch((error) => console.log(error))
        // console.log('lists2:',lists)
    }

    nextPath(path) {
        // console.log('cas',storecid)
        this.props.history.push(path)
        // this.props.history.push(path, {storeCaseId: storecid})
    }

    handleLinkClick(caseId,noduleNo,e) {
        // console.log('dataset:',e.currentTarget.dataset.id)
        // // request, api, modifier
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: caseId
        }
        axios.post(draftConfig.getDataPath, qs.stringify(params), {headers})
        .then(res => {
            // console.log('result from server', res.data)
            console.log(params)
            console.log(res.data)
            this.nextPath('/case/' + params.caseId + '/' + res.data + '#'+noduleNo)
            // window.location.href='/case/' + params.caseId + '/' + res.data + '#'+noduleNo
        })
        .catch(err => {
            console.log(err)
        })
    }
    handlePaginationChange(e, {activePage}) {
        this.setState({activePage})
    }

    handleLabelsIcon(indexx,value,e){
        console.log('value',value,indexx)
        delete panels[indexx]
        switch(value){
            case '低危':
                // console.log('value',value)
                nums['低危']-=1
                if(nums['高危']===1){
                    this.setState({malignancy:2,labels:panels,activePage:'1'})
                }
                else{
                    this.setState({malignancy:-1,labels:panels,activePage:'1'})
                };break
            case '高危':
                nums['高危']-=1
                if(nums['低危']===1){
                    this.setState({malignancy:1,labels:panels,activePage:'1'})
                }
                else{
                    this.setState({malignancy:-1,labels:panels,activePage:'1'})
                };break
            case '毛刺':
                nums['毛刺']-=1
                this.setState({spiculation:-1,labels:panels,activePage:'1'}) ;break
            case '分叶':
                nums['分叶']-=1
                this.setState({lobulation:-1,labels:panels,activePage:'1'}) ;break
            case '钙化':
                nums['钙化']-=1
                this.setState({calcification:-1,labels:panels,activePage:'1'}) ;break
            case '实性':
                nums['实性']-=1
                this.setState({texture:-1,labels:panels,activePage:'1'}) ;break
            default:
                this.setState({labels:panels,activePage:'1',diameterStart:0,diameterEnd:5});break
        }
        // console.log('indexx',indexx)
        // console.log('panels',panels)
        // console.log('idx',idx)
        // this.setState({labels:panels})
    }

    handleLabels(e){  
        const value=e.target.text
        // console.log('value',value,nums[value],typeof(value),value.length)
        if(value.split("",value.length).includes("m")){//直径专属
            if(diaMeters!==-1){
                delete panels[diaMeters]
            }
            diaMeters=idx
            panels.push(
                <Label as='a' key={idx}  className='labelTags'>
                    {value}
                    <Icon name='delete' onClick={this.handleLabelsIcon.bind(this,idx,value)} inverted color='green'/>
                </Label>
            )
            idx+=1
            if(value==='<=0.3cm'){
                this.setState({diameterStart:0,diameterEnd:0.3,labels:panels,activePage:'1'})
            }
            else if(value==='0.3cm-0.5cm'){
                this.setState({diameterStart:0.3,diameterEnd:0.5,labels:panels,activePage:'1'})
            }
            else if(value==='0.5cm-1cm'){
                this.setState({diameterStart:0.5,diameterEnd:1,labels:panels,activePage:'1'})
            }
            else if(value==='1cm-1.3cm'){
                this.setState({diameterStart:1,diameterEnd:1.3,labels:panels,activePage:'1'})
            }
            else if(value==='1.3cm-3cm'){
                this.setState({diameterStart:1.3,diameterEnd:3,labels:panels,activePage:'1'})
            }
            else if(value==='>=3cm'){
                this.setState({diameterStart:3,diameterEnd:5,labels:panels,activePage:'1'})
            }
            return
        }


        if(nums[value]===0){
            panels.push(
                <Label as='a' key={idx}  className='labelTags'>
                    {value}
                    <Icon name='delete' onClick={this.handleLabelsIcon.bind(this,idx,value)} inverted color='green'/>
                </Label>
            )
            idx+=1
        
            switch(value){
                case '低危':
                    nums['低危']+=1
                    if(nums['高危']===1){
                        this.setState({malignancy:0,labels:panels,activePage:'1'})
                    }
                    else{
                        this.setState({malignancy:1,labels:panels,activePage:'1'})
                    };break
                case '高危':
                    nums['高危']+=1
                    if(nums['低危']===1){
                        this.setState({malignancy:0,labels:panels,activePage:'1'})
                    }
                    else{
                        this.setState({malignancy:2,labels:panels,activePage:'1'})
                    };break
                case '毛刺':
                    nums['毛刺']+=1
                    this.setState({spiculation:2,labels:panels,activePage:'1'}) ;break
                case '分叶':
                    nums['分叶']+=1
                    this.setState({lobulation:2,labels:panels,activePage:'1'}) ;break
                case '钙化':
                    nums['钙化']+=1
                    this.setState({calcification:2,labels:panels,activePage:'1'}) ;break
                case '实性':
                    nums['实性']+=1
                    this.setState({texture:2,labels:panels,activePage:'1'}) ;break
            }
        }
    }

    handleInputChange(e) {
        const value = e.currentTarget.value
        const name = e.currentTarget.name
        if(diaMeters!==-1){
            delete panels[diaMeters]
            diaMeters=-1
            this.setState({labels:panels,activePage:'1'})
        }
        if (name === 'left') {
            this.setState({diameterStart:value,activePage:'1'})
            
        } 
        else if (name === 'right') {
            this.setState({diameterEnd:value,activePage:'1'})
        }
    }

    render(){
        const lists = this.state.lists
        console.log('panels',panels)
        console.log('idx',idx)
        console.log('nums',nums)
        console.log('diameters',diaMeters)
        
        return(
            <div>
                <Grid >
                    <Grid.Row className="conlabel">
                        <Grid.Column width={2}>
                            <Header as='h3' inverted >筛选条件:</Header>
                        </Grid.Column>
                        <Grid.Column width={7}>
                            {this.state.labels}
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12}>
                            <Grid inverted divided className="gridcontainer">
                                <Grid.Row className="gridRow">
                                    <Grid.Column width={3} className="gridCategory">
                                        <strong>风险程度</strong>
                                    </Grid.Column>
                                    <Grid.Column width={2} className="gridLabel">
                                        <a style={{color:'#66cfec'}} onClick={this.handleLabels}>低危</a>
                                    </Grid.Column>
                                    <Grid.Column width={2} className="gridLabel">
                                    <a style={{color:'#66cfec'}} onClick={this.handleLabels}>高危</a>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row className="gridRow">
                                    <Grid.Column width={3} className="gridCategory">
                                        <strong>直径</strong>
                                    </Grid.Column>
                                    <Grid.Column width={13} className="gridLabel">
                                        <Grid inverted divided>
                                            <Grid.Row>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>&lt;=0.3cm</a>
                                                    
                                                </Grid.Column>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>0.3cm-0.5cm</a>
                                                    
                                                </Grid.Column>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>0.5cm-1cm</a>
                                                    
                                                </Grid.Column>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>1cm-1.3cm</a>
                                                    
                                                </Grid.Column>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>1.3cm-3cm</a>
                                                    
                                                </Grid.Column>
                                                <Grid.Column width={2} className="gridLabel">
                                                <a style={{color:'#66cfec'}} onClick={this.handleLabels}>&gt;=3cm</a>
                                                    
                                                </Grid.Column>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Column width={6} className="gridLabel inputContainer">
                                                    <a style={{color:'#66cfec'}}>自定义：</a>
                                                    <Input id="searchBox" placeholder="cm" onChange={this.handleInputChange} value={
                                                         this.state.diameterStart}
                                                    name='left'/>
                                                    <em>&nbsp;&nbsp;-&nbsp;&nbsp;</em>
                                                    <Input id="searchBox" placeholder="cm" onChange={this.handleInputChange} value={
                                                        this.state.diameterEnd}
                                                    name='right'/>
                                                    <a style={{marginLeft:15,color:'#66cfec',fontSize:20}}>cm</a>
                                                </Grid.Column>
                                            </Grid.Row>
                                        </Grid>
                                    </Grid.Column>
                                    
                                </Grid.Row>
                                <Grid.Row className="gridRow">
                                    <Grid.Column width={3} className="gridCategory">
                                        <strong>影像学特征</strong>
                                    </Grid.Column>
                                    <Grid.Column width={13} className="gridLabel">
                                    <Grid inverted divided>
                                        <Grid.Row>
                                            <Grid.Column width={1} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>毛刺</a>
                                                
                                            </Grid.Column>
                                            <Grid.Column width={1} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a>
                                                
                                            </Grid.Column>
                                            {/* <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>胸膜内陷</a>
                                                
                                            </Grid.Column> */}
                                            <Grid.Column width={1} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>钙化</a>
                                                
                                            </Grid.Column>
                                            {/* <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>半实性</a>
                                                
                                            </Grid.Column> */}
                                            <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>实性</a>
                                                
                                            </Grid.Column>
                                            {/* <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>血管集束征</a>
                                                
                                            </Grid.Column>
                                            <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>含支气管影</a>
                                                
                                            </Grid.Column> */}
                                        </Grid.Row>
                                    </Grid>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    <Grid.Row >
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12} id="container">
                            <div style={{minHeight:590}}>
                            <Table celled inverted textAlign='center' fixed id="table">
                                <Table.Header id='table-header'>
                                    <Table.Row>
                                        <Table.HeaderCell>结节体积(cm³)</Table.HeaderCell>
                                        <Table.HeaderCell>结节直径(cm)</Table.HeaderCell>
                                        
                                        <Table.HeaderCell>危险程度</Table.HeaderCell>
                                        <Table.HeaderCell>分叶</Table.HeaderCell>
                                        <Table.HeaderCell>毛刺</Table.HeaderCell>
                                        <Table.HeaderCell>实性</Table.HeaderCell>
                                        {/* <Table.HeaderCell>caseId</Table.HeaderCell> */}
                                        <Table.HeaderCell>钙化</Table.HeaderCell>
                                        <Table.HeaderCell>查看详情</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {lists.map((content, index) => {
                                        let caseId
                                        let noduleNo
                                        // console.log('content:',content)
                                        return (
                                            <Table.Row key={index}>
                                                {Object.entries(content).map((key,value)=>{
                                                    // console.log('key:',key[0])
                                                    if(key[0]==='caseId'){
                                                        caseId=key[1]
                                                    }
                                                    else if(key[0]==='noduleNo'){
                                                        noduleNo=key[1]
                                                    }
                                                    else if(key[0]==='status'){

                                                    }
                                                    else{
                                                        return(
                                                            <Table.Cell key={value}>{key[1]}</Table.Cell>
                                                        )
                                                    }
                                                })}
                                                <Table.Cell>
                                                    <Button 
                                                        icon='right arrow'
                                                        className='ui green inverted button' 
                                                        onClick={this.handleLinkClick.bind(this,caseId,noduleNo)}
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

export default SearchNodulePanel
