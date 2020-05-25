import React, {Component} from 'react'
import { Pagination,Label,Grid, Table,Header, Icon,Button,Input, Dropdown } from 'semantic-ui-react'
import MainList from '../components/MainList'
import axios from 'axios'
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import '../css/searchnodulePanel.css'
import { isType } from '@babel/types'

const config = require('../config.json')
const recordConfig = config.record
const draftConfig = config.draft


let  nums={'危险':null,'毛刺':null,'分叶':null,'钙化':null,'实性':null,'<=0.3cm':null,'0.3cm-0.5cm':null,'0.5cm-1cm':null,
'1cm-1.3cm':null,'1.3cm-3cm':null,'>=3cm':null}//限制labels数量

export class SearchNodulePanel extends Component {
    constructor(props){
        super(props)
        this.state={
            checked: false,
            totalPage: 1,
            // diameterLeftKeyword: '',
            // diameterRightKeyword:'',
            // labels:[],//标签显示
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
            diameterEnd:5,
            totalResults:1,
            diameterContainer:'0_5'
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
        this.handleImageLabels=this
            .handleImageLabels
            .bind(this)
    }

    componentDidMount() {
        nums={'危险':null,'毛刺':null,'分叶':null,'钙化':null,'实性':null,'<=0.3cm':null,'0.3cm-0.5cm':null,'0.5cm-1cm':null,
    '1cm-1.3cm':null,'1.3cm-3cm':null,'>=3cm':null}//限制labels数量
        this.getTotalPages()
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('diameterContainer',prevState.diameterContainer,this.state.diameterContainer)
        if (prevState.diameterContainer!==this.state.diameterContainer) {
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
            diameters:this.state.diameterContainer
            // volumeStart:this.state.volumeStart,
            // volumeEnd:this.state.volumeEnd,
            
        }
        axios.post(recordConfig.filterNodulesMulti, qs.stringify(params)).then((response) => {
            const data = response.data
            console.log('total:',data)
            
            this.getAtPageIfo()
            this.setState({totalPage:data.pages,totalResults:data.nodules})
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
            diameters:this.state.diameterContainer
        }
        
        axios.post(recordConfig.getNodulesAtPageMulti, qs.stringify(params)).then((response) => {
            let lists=[]
            const data = response.data
            
            console.log('pages:',data)
            for (const idx in data){
                let sequence={'patienId':'','patientSex':'','patientBirth':'','volume':0,'diameter':0,'malignancy':'','lobulation':'',
                'spiculation':'','texture':'','calcification':'','caseId':'','noduleNo':'','status':0}
                
                if(data[idx]['volume']===undefined){
                    console.log(data[idx])
                }
                sequence['patienId']=data[idx]['patienId']
                sequence['patientSex']=data[idx]['patientSex']==='M'?'男':'女';
                sequence['patientBirth']=2020-parseInt(data[idx]['patientBirth'].slice(0,4))
                sequence['volume']=data[idx]['volume']===undefined? '':Math.floor(data[idx]['volume'] * 100) / 100
                sequence['diameter']=Math.floor(data[idx]['diameter'] * 100) / 100
                sequence['malignancy']=data[idx]['malignancy']==2?'高危 ':'低危'
                sequence['lobulation']=data[idx]['lobulation']==2?'是 ':'否'
                sequence['spiculation']=data[idx]['spiculation']==2?'是 ':'否'
                sequence['texture']=data[idx]['texture']==2?'实性 ':'磨玻璃'
                sequence['calcification']=data[idx]['calcification']==2?'是 ':'否'
                sequence['caseId']=data[idx]['caseId']
                sequence['noduleNo']=data[idx]['noduleNo']
                sequence['status']=data[idx]['status']
                lists.push(sequence)
            }
            console.log('lists1:',lists)
            this.setState({lists:lists})
            // this.setState({totalPage:data.pages,totalResults:data.nodules})
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

    handleLabelsIcon(value,e){
        switch(value){
            case '低危':
                // console.log('value',value)
                nums['危险']=null
                    this.setState({malignancy:-1,activePage:'1'});break
            case '高危':
                        // console.log('value',value)
                nums['危险']=null
                    this.setState({malignancy:-1,activePage:'1'});break
            case '毛刺':
                nums['毛刺']=null
                this.setState({spiculation:-1,activePage:'1'}) ;break
            case '非毛刺':
                nums['毛刺']=null
                this.setState({spiculation:-1,activePage:'1'}) ;break
            case '分叶':
                nums['分叶']=null
                this.setState({lobulation:-1,activePage:'1'}) ;break
            case '非分叶':
                nums['分叶']=null
                this.setState({lobulation:-1,activePage:'1'}) ;break
            case '钙化':
                nums['钙化']=null
                this.setState({calcification:-1,activePage:'1'}) ;break
            case '非钙化':
                nums['钙化']=null
                this.setState({calcification:-1,activePage:'1'}) ;break
            case '实性':
                nums['实性']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '半实性':
                nums['半实性']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '磨玻璃':
                nums['实性']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '<=0.3cm':
                nums['<=0.3cm']=null
                this.setState((state, props) => ({
                    diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
                    state.diameterContainer.indexOf('0_0.3')===0?
                    state.diameterContainer.split('0_0.3@').join(''):state.diameterContainer.split('@0_0.3').join(''),
                    activePage:'1'
                }));break
            // case '0.3cm-0.5cm':
            //     nums['0.3cm-0.5cm']=null
            //     this.setState((state, props) => ({
            //         diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
            //         state.diameterContainer.indexOf('0.3_0.5')===0?
            //         state.diameterContainer.split('0.3_0.5@').join(''):state.diameterContainer.split('@0.3_0.5').join(''),
            //         activePage:'1'
            //     }));break    
            // case '0.5cm-1cm':
            //     nums['0.5cm-1cm']=null
            //     this.setState((state, props) => ({
            //         diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
            //         state.diameterContainer.indexOf('0.5_1')===0?
            //         state.diameterContainer.split('0.5_1@').join(''):state.diameterContainer.split('@0.5_1').join(''),
            //         activePage:'1'
            //     }));break
            // case '1cm-1.3cm':
            //     nums['1cm-1.3cm']=null
            //     this.setState((state, props) => ({
            //         diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
            //         state.diameterContainer.indexOf('1_1.3')===0?
            //         state.diameterContainer.split('1_1.3@').join(''):state.diameterContainer.split('@1_1.3').join(''),
            //         activePage:'1'
            //     }));break
            // case '1.3cm-3cm':
            //     nums['1.3cm-3cm']=null
            //     this.setState((state, props) => ({
            //         diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
            //         state.diameterContainer.indexOf('1.3_3')===0?
            //         state.diameterContainer.split('1.3_3@').join(''):state.diameterContainer.split('@1.3_3').join(''),
            //         activePage:'1'
            //     }));break
            case '>=3cm':
                nums['>=3cm']=null
                this.setState((state, props) => ({
                    diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
                    state.diameterContainer.indexOf('3_5')===0?
                    state.diameterContainer.split('3_5@').join(''):state.diameterContainer.split('@3_5').join(''),
                    activePage:'1'
                }));break
            default:
                nums[value]=null
                let left=value.split('cm-')[0]
                let right=value.split('cm-')[1].split('cm')[0]
                // console.log('del',left,right)
                this.setState((state, props) => ({
                    diameterContainer:state.diameterContainer.indexOf("@")===-1?'0_5':
                    state.diameterContainer.indexOf(left+'_'+right)===0?
                    state.diameterContainer.split(left+'_'+right+'@').join(''):state.diameterContainer.split('@'+left+'_'+right).join(''),
                    activePage:'1'
                }));break
        }
    }

    handleLabels(e){  
        const value=e.target.text
        // const hhh=e.target.innerHTML
        // console.log('value',value,hhh)
        // console.log('value',value,nums[value],typeof(value),value.length)
        if(value==='<=0.3cm'){
            nums['<=0.3cm']=value
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'0_0.3':state.diameterContainer + '@0_0.3',
                activePage:'1'
            }))
        }
        else if(value==='0.3cm-0.5cm'){
            nums['0.3cm-0.5cm']=value
            
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'0.3_0.5':state.diameterContainer + '@0.3_0.5',
                activePage:'1'
            }))
        }
        else if(value==='0.5cm-1cm'){
            nums['0.5cm-1cm']=value
            
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'0.5_1':state.diameterContainer + '@0.5_1',
                activePage:'1'
            }))
        }
        else if(value==='1cm-1.3cm'){
            nums['1cm-1.3cm']=value
            
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'1_1.3':state.diameterContainer + '@1_1.3',
                activePage:'1'
            }))
        }
        else if(value==='1.3cm-3cm'){
            nums['1.3cm-3cm']=value
            
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'1.3_3':state.diameterContainer + '@1.3_3',
                activePage:'1'
            }))
        }
        else if(value==='>=3cm'){
            nums['>=3cm']=value
            
            this.setState((state, props) => ({
                diameterContainer: state.diameterContainer==='0_5'?'3_5':state.diameterContainer + '@3_5',
                activePage:'1'
            }))
        }

        else{
            nums['危险']=value
            switch(value){
                case '低危':
                    this.setState({malignancy:1,activePage:'1'});break
                case '高危':
                    this.setState({malignancy:2,activePage:'1'});break
            }
        }
    }

    handleImageLabels(e){
        const text=e.target.innerHTML
        if(text==='毛刺'||text==='非毛刺'){
            nums['毛刺']=text
        }
        else if(text==='分叶'||text==='非分叶'){
            nums['分叶']=text
        }
        else if(text==='钙化'||text==='非钙化'){
            nums['钙化']=text
        }
        else if(text==='实性'||text==='半实性'||text==='磨玻璃'){
            nums['实性']=text
        }

        switch(text){
            case '毛刺':
                this.setState({spiculation:2,activePage:'1'});break
            case '非毛刺':
                this.setState({spiculation:1,activePage:'1'});break
            case '分叶':
                this.setState({lobulation:2,activePage:'1'});break
            case '非分叶':
                this.setState({lobulation:1,activePage:'1'});break
            case '钙化':
                this.setState({calcification:2,activePage:'1'});break
            case '非钙化':
                this.setState({calcification:1,activePage:'1'});break
            case '实性':
                this.setState({texture:2,activePage:'1'});break
            case '半实性':
                this.setState({texture:3,activePage:'1'});break
            case '磨玻璃':
                this.setState({texture:1,activePage:'1'});break
        }
    }

    handleInputChange(e) {
        const value = e.currentTarget.value
        const name = e.currentTarget.name
        if (name === 'left') {
            this.left=value
        } 
        else if (name === 'right') {
            this.right=value
        }
    }

    handleAddDiameters(e){
        console.log('add',this.left)
        console.log('add',this.right)
        nums[this.left+'cm-'+this.right+'cm']=this.left+'cm-'+this.right+'cm'
        this.setState((state, props) => ({
            diameterContainer: state.diameterContainer==='0_5'?this.left+'_'+this.right:state.diameterContainer + '@'+this.left+'_'+this.right,
            activePage:'1'
        }))
    }

    componentWillUnmount() {
        console.log('searchNodule')
    }

    render(){
        const lists = this.state.lists
        // console.log('diameter',this.state.diameterContainer)
        // console.log('idx',idx)
        // console.log('nums',nums)
        // console.log('diameters',diaMeters)
        
        return(
            <div>
                <Grid >
                    <Grid.Row className="conlabel">
                        <Grid.Column width={2}>
                            <Header as='h3' inverted >筛选条件:</Header>
                        </Grid.Column>
                        <Grid.Column width={7}>
                            {Object.entries(nums).map((key,value)=>{
                                
                                return(
                                    key[1]!==null?
                                    <Label as='a' key={value}  className='labelTags'>
                                        {key[1]}
                                        <Icon name='delete' onClick={this.handleLabelsIcon.bind(this,key[1])} inverted color='green'/>
                                    </Label>:null
                                )
                            })}
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
                                                    <Input id="searchBox" placeholder="cm" onChange={this.handleInputChange} name='left'/>
                                                    <em>&nbsp;&nbsp;-&nbsp;&nbsp;</em>
                                                    <Input id="searchBox" placeholder="cm" onChange={this.handleInputChange} name='right'/>
                                                    <a style={{marginLeft:15,color:'#66cfec',fontSize:20}}>cm</a>
                                                    <em>&nbsp;&nbsp;&nbsp;&nbsp;</em>
                                                    <Button 
                                                        icon='add'
                                                        className='ui green inverted button' 
                                                        size='mini'
                                                        onClick={this.handleAddDiameters.bind(this)}
                                                    ></Button>
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
                                            <Grid.Column style={{width:'8%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>毛刺</a> */}
                                                <Dropdown text='毛刺' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>毛刺</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非毛刺</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                
                                            </Grid.Column>
                                            <Grid.Column style={{width:'8%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='分叶' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>分叶</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非分叶</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </Grid.Column>
                                            {/* <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>胸膜内陷</a>
                                                
                                            </Grid.Column> */}
                                            <Grid.Column style={{width:'8%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>钙化</a> */}
                                            <Dropdown text='钙化' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                    <Dropdown.Item onClick={this.handleImageLabels}>钙化</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非钙化</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                
                                            </Grid.Column>
                                            {/* <Grid.Column width={2} className="gridLabel">
                                            <a style={{color:'#66cfec'}} onClick={this.handleLabels}>半实性</a>
                                                
                                            </Grid.Column> */}
                                            <Grid.Column style={{width:'8%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>实性</a> */}
                                            <Dropdown text='实性' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                    <Dropdown.Item onClick={this.handleImageLabels}>实性</Dropdown.Item>
                                                        <Dropdown.Item >半实性</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>磨玻璃</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
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
                    <Grid.Row className="conlabel">
                        <Grid.Column width={2}>
                            <Header as='h3' inverted >结节数目:{this.state.totalResults}</Header>
                        </Grid.Column>
                        
                    </Grid.Row>
                    <Grid.Row >
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12} id="container">
                            <div style={{minHeight:590}}>
                            <Table celled inverted textAlign='center' fixed id="table">
                                <Table.Header id='table-header'>
                                    <Table.Row>
                                        <Table.HeaderCell>病人ID</Table.HeaderCell>
                                        <Table.HeaderCell>性别</Table.HeaderCell>
                                        <Table.HeaderCell>年龄</Table.HeaderCell>
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
