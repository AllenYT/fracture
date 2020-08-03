import React, {Component} from 'react'
import XLSX from 'xlsx'
import { Pagination,Label,Grid, Table,Header, Icon,Button,Input, Dropdown } from 'semantic-ui-react'
// import ReactHTMLTableToExcel from 'react-html-table-to-excel'
import MainList from '../components/MainList'
import axios from 'axios'
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import '../css/searchnodulePanel.css'
// import reqwest from 'reqwest'
import { isType } from '@babel/types'

const config = require('../config.json')
const recordConfig = config.record
const draftConfig = config.draft
const subsetConfig = config.subset


let  nums={'危险':null,'毛刺征':null,'分叶征':null,'钙化':null,'密度':null,'胸膜凹陷征':null,'空洞征':null,'血管集束征':null,
'空泡征':null,'支气管充气征':null,'<=0.3cm':null,'0.3cm-0.5cm':null,'0.5cm-1cm':null,'1cm-1.3cm':null,'1.3cm-3cm':null,
'>=3cm':null}//限制labels数量


export class SearchNodulePanel extends Component {
    constructor(props){
        super(props)
        this.state={
            // diameterLeftKeyword: '',
            // diameterRightKeyword:'',
            // labels:[],//标签显示
            lists:[],//数据显示

            malignancy: -1,
            calcification: -1,
            spiculation: -1,
            lobulation:-1,
            texture:-1,
            pin:-1,
            cav:-1,
            vss:-1,
            bea:-1,
            bro:-1,
            totalPage: 1,//全部页面
            activePage:'1',
            // volumeStart:-1,
            // volumeEnd:-1,
            // diameterStart:0,
            // diameterEnd:5,
            totalResults:0,
            diameterContainer:'0_5',
            show:false,
            load:false
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
        this.savetoExcel=this
            .savetoExcel
            .bind(this)
    }

    componentDidMount() {
        nums={'危险':null,'毛刺征':null,'分叶征':null,'钙化':null,'密度':null,'胸膜凹陷征':null,'空洞征':null,'血管集束征':null,
'空泡征':null,'支气管充气征':null,'<=0.3cm':null,'0.3cm-0.5cm':null,'0.5cm-1cm':null,'1cm-1.3cm':null,'1.3cm-3cm':null,
'>=3cm':null}//限制labels数量
        this.getTotalPages()
    }

    componentDidUpdate(prevProps, prevState) {
        console.log('diameterContainer',prevState.diameterContainer,this.state.diameterContainer)
        if (prevState.diameterContainer!==this.state.diameterContainer) {
            this.setState({show:false})
            this.getTotalPages()
        }
        
        if(prevState.malignancy !== this.state.malignancy || prevState.calcification !== this.state.calcification ||prevState.spiculation != this.state.spiculation
            ||prevState.lobulation !== this.state.lobulation||prevState.texture !== this.state.texture||prevState.pin !== this.state.pin
            ||prevState.cav !== this.state.cav||prevState.vss !== this.state.vss||prevState.bea !== this.state.bea
            ||prevState.bro !== this.state.bro){
                this.setState({show:false})
                this.getTotalPages()
        }
        if(prevState.activePage!==this.state.activePage){
            this.setState({show:false})
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
            diameters:this.state.diameterContainer,
            pin:this.state.pin,
            cav:this.state.cav,
            vss:this.state.vss,
            bea:this.state.bea,
            bro:this.state.bro
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
            diameters:this.state.diameterContainer,
            pin:this.state.pin,
            cav:this.state.cav,
            vss:this.state.vss,
            bea:this.state.bea,
            bro:this.state.bro
        }
        
        axios.post(recordConfig.getNodulesAtPageMulti, qs.stringify(params)).then((response) => {
            let lists=[]
            const data = response.data
            
            console.log('pages:',data)
            for (const idx in data){
                let sequence={'病人ID':'','性别':'','年龄':'','结节体积(cm³)':0,'结节直径(cm)':0,'危险程度':'','分叶征':'',
                '毛刺征':'','密度':'','钙化':'','胸膜凹陷征':'','空洞征':'','血管集束征':'','空泡征':'','支气管充气征':'',
                'caseId':'','status':''}
                
                if(data[idx]['volume']===undefined){
                    console.log(data[idx])
                }
                sequence['病人ID']=data[idx]['patienId']
                sequence['性别']=data[idx]['patientSex']==='M'?'男':'女';
                sequence['年龄']=2020-parseInt(data[idx]['patientBirth'].slice(0,4))
                sequence['结节体积(cm³)']=data[idx]['volume']===undefined? '':Math.floor(data[idx]['volume'] * 100) / 100
                sequence['结节直径(cm)']=Math.floor(data[idx]['diameter'] * 100) / 100
                sequence['危险程度']=data[idx]['malignancy']==2?'高危':'低危'
                sequence['分叶征']=data[idx]['lobulation']==2?'是':'否'
                sequence['毛刺征']=data[idx]['spiculation']==2?'是':'否'
                sequence['密度']=data[idx]['texture']==2?'实性':'磨玻璃'
                sequence['钙化']=data[idx]['calcification']==2?'是':'否'
                sequence['胸膜凹陷征']=data[idx]['pin']===undefined?'':data[idx]['pin']===2?'是':'否'
                sequence['空洞征']=data[idx]['cav']===undefined?'':data[idx]['cav']===2?'是':'否'
                sequence['血管集束征']=data[idx]['vss']===undefined?'':data[idx]['vss']===2?'是':'否'
                sequence['空泡征']=data[idx]['bea']===undefined?'':data[idx]['bea']===2?'是':'否'
                sequence['支气管充气征']=data[idx]['bro']===undefined?'':data[idx]['cav']===2?'是':'否'
                sequence['caseId']=data[idx]['caseId']
                sequence['noduleNo']=data[idx]['noduleNo']
                sequence['status']=data[idx]['status']
                lists.push(sequence)
            }
            console.log('lists1:',lists)
            this.setState({lists:lists,show:true})
            // this.setState({totalPage:data.pages,totalResults:data.nodules})
        }).catch((error) => console.log(error))
        // console.log('lists2:',lists)
    }

    savetoExcel(){
      //要导出的json数据
      const params = {
        malignancy: this.state.malignancy,
            calcification: this.state.calcification,
            spiculation: this.state.spiculation,
            lobulation:this.state.lobulation,
            texture:this.state.texture,
            page:'all',
            // volumeStart:this.state.volumeStart,
            // volumeEnd:this.state.volumeEnd,
            diameters:this.state.diameterContainer,
            pin:this.state.pin,
            cav:this.state.cav,
            vss:this.state.vss,
            bea:this.state.bea,
            bro:this.state.bro
    }
    
    axios.post(recordConfig.getNodulesAtPageMulti, qs.stringify(params)).then((response) => {
        let datalists=[]
        const data = response.data

        console.log('params', params)
        
        // console.log('pages:',data)
        for (const idx in data){
            let sequence={'病人ID':'','性别':'','年龄':'','结节体积(cm³)':0,'结节直径(cm)':0,'危险程度':'','分叶征':'',
                '毛刺征':'','密度':'','钙化':'','胸膜凹陷征':'','空洞征':'','血管集束征':'','空泡征':'','支气管充气征':'',
                'caseId':'','status':''}
                
                if(data[idx]['volume']===undefined){
                    console.log(data[idx])
                }
                sequence['病人ID']=data[idx]['patienId']
                sequence['性别']=data[idx]['patientSex']==='M'?'男':'女';
                sequence['年龄']=2020-parseInt(data[idx]['patientBirth'].slice(0,4))
                sequence['结节体积(cm³)']=data[idx]['volume']===undefined? '':Math.floor(data[idx]['volume'] * 100) / 100
                sequence['结节直径(cm)']=Math.floor(data[idx]['diameter'] * 100) / 100
                sequence['危险程度']=data[idx]['malignancy']==2?'高危':'低危'
                sequence['分叶征']=data[idx]['lobulation']==2?'是':'否'
                sequence['毛刺征']=data[idx]['spiculation']==2?'是':'否'
                sequence['密度']=data[idx]['texture']==2?'实性':'磨玻璃'
                sequence['钙化']=data[idx]['calcification']==2?'是':'否'
                sequence['胸膜凹陷征']=data[idx]['pin']===undefined?'':data[idx]['pin']===2?'是':'否'
                sequence['空洞征']=data[idx]['cav']===undefined?'':data[idx]['cav']===2?'是':'否'
                sequence['血管集束征']=data[idx]['vss']===undefined?'':data[idx]['vss']===2?'是':'否'
                sequence['空泡征']=data[idx]['bea']===undefined?'':data[idx]['bea']===2?'是':'否'
                sequence['支气管充气征']=data[idx]['bro']===undefined?'':data[idx]['cav']===2?'是':'否'
                sequence['caseId']=data[idx]['caseId']
                sequence['noduleNo']=data[idx]['noduleNo']
                sequence['status']=data[idx]['status']
            datalists.push(sequence)
            
        }
        // console.log('lists1:',datalists)
        var arr = []
        var value=[]
        arr[0] =  ["病人ID","性别","年龄","结节体积(cm³)", "结节直径(cm)", "危险程度", "分叶征", "毛刺征", "密度", "钙化",
         "胸膜凹陷征", "空洞征", "血管集束征", "空泡征", "支气管充气征"]
        for(var i =0;i<datalists.length;i++){
            value = []
            for(var key in datalists[i]){
                if(key =='status' || key == 'noduleNo' || key == 'caseId')
                    continue
                value.push(datalists[i][key])
            }
            arr[i+1] = value
        }
        //   console.log('arr',arr)
        //列标题
        const sheet = XLSX.utils.aoa_to_sheet(arr);

        // 先组装wookbook数据格式
            let workbook = {
                SheetNames: ['test'], // 总表名
                Sheets: {test: sheet}, // test是表名
            };
            // 下载表格
            XLSX.writeFile(workbook, '肺结节列表.xlsx');
        
    }).catch((error) => console.log(error))
      
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
                nums['毛刺征']=null
                this.setState({spiculation:-1,activePage:'1'}) ;break
            case '非毛刺':
                nums['毛刺征']=null
                this.setState({spiculation:-1,activePage:'1'}) ;break
            case '分叶':
                nums['分叶征']=null
                this.setState({lobulation:-1,activePage:'1'}) ;break
            case '非分叶':
                nums['分叶征']=null
                this.setState({lobulation:-1,activePage:'1'}) ;break
            case '钙化':
                nums['钙化']=null
                this.setState({calcification:-1,activePage:'1'}) ;break
            case '非钙化':
                nums['钙化']=null
                this.setState({calcification:-1,activePage:'1'}) ;break
            case '实性':
                nums['密度']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '半实性':
                nums['密度']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '磨玻璃':
                nums['密度']=null
                this.setState({texture:-1,activePage:'1'}) ;break
            case '胸膜凹陷':
                nums['胸膜凹陷征']=null
                this.setState({pin:-1,activePage:'1'}) ;break
            case '非胸膜凹陷':
                nums['胸膜凹陷征']=null
                this.setState({pin:-1,activePage:'1'}) ;break
            case '空洞':
                nums['空洞征']=null
                this.setState({cav:-1,activePage:'1'}) ;break
            case '非空洞':
                nums['空洞征']=null
                this.setState({cav:-1,activePage:'1'}) ;break
            case '血管集束':
                nums['血管集束征']=null
                this.setState({vss:-1,activePage:'1'}) ;break
            case '非血管集束':
                nums['血管集束征']=null
                this.setState({vss:-1,activePage:'1'}) ;break
            case '空泡':
                nums['空泡征']=null
                this.setState({bea:-1,activePage:'1'}) ;break
            case '非空泡':
                nums['空泡征']=null
                this.setState({bea:-1,activePage:'1'}) ;break
            case '支气管充气':
                nums['支气管充气征']=null
                this.setState({bro:-1,activePage:'1'}) ;break
            case '非支气管充气':
                nums['支气管充气征']=null
                this.setState({bro:-1,activePage:'1'}) ;break
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
            nums['毛刺征']=text
        }
        else if(text==='分叶'||text==='非分叶'){
            nums['分叶征']=text
        }
        else if(text==='钙化'||text==='非钙化'){
            nums['钙化']=text
        }
        else if(text==='实性'||text==='半实性'||text==='磨玻璃'){
            nums['密度']=text
        }
        else if(text==='胸膜凹陷'||text==='非胸膜凹陷'){
            nums['胸膜凹陷征']=text
        }
        else if(text==='空洞'||text==='非空洞'){
            nums['空洞征']=text
        }
        else if(text==='血管集束'||text==='非血管集束'){
            nums['血管集束征']=text
        }
        else if(text==='空泡'||text==='非空泡'){
            nums['空泡征']=text
        }
        else if(text==='支气管充气'||text==='非支气管充气'){
            nums['支气管充气征']=text
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
            case '胸膜凹陷':
                this.setState({pin:2,activePage:'1'});break
            case '非胸膜凹陷':
                this.setState({pin:1,activePage:'1'});break
            case '空洞':
                this.setState({cav:2,activePage:'1'});break
            case '非空洞':
                this.setState({cav:1,activePage:'1'});break
            case '血管集束':
                this.setState({vss:2,activePage:'1'});break
            case '非血管集束':
                this.setState({vss:1,activePage:'1'});break
            case '空泡':
                this.setState({bea:2,activePage:'1'});break
            case '非空泡':
                this.setState({bea:1,activePage:'1'});break
            case '支气管充气':
                this.setState({bro:2,activePage:'1'});break
            case '非支气管充气':
                this.setState({bro:1,activePage:'1'});break

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
    handleAddQueues(e){
        this.setState({load:true})
        let text=document.getElementById('inputQueue').value
        console.log('text',text)
        if(text!=='' && this.state.totalResults>0){
            const params = {
                malignancy: this.state.malignancy,
                calcification: this.state.calcification,
                spiculation: this.state.spiculation,
                lobulation:this.state.lobulation,
                texture:this.state.texture,
                page:'all',
                // volumeStart:this.state.volumeStart,
                // volumeEnd:this.state.volumeEnd,
                diameters:this.state.diameterContainer,
                pin:this.state.pin,
                cav:this.state.cav,
                vss:this.state.vss,
                bea:this.state.bea,
                bro:this.state.bro
            }
            
            axios.post(recordConfig.getNodulesAtPageMulti, qs.stringify(params)).then((response) => {
                const data = response.data
                let patients=''
                console.log('params', params)
                
                for (let i=0;i<data.length;i++){
                    if(i===0 && patients.indexOf(data[i]['patienId'])===-1){
                        patients=''+data[i]['patienId']
                    }
                    else if(i>0 && patients.indexOf(data[i]['patienId'])===-1){
                        patients=patients+'_'+data[i]['patienId']
                    }
                    else{
                        continue
                    }
                }
                const queueParams={
                    username:localStorage.getItem('username'),
                    patientIds:patients,
                    subsetName:text
                }
                axios.post(subsetConfig.createQueue, qs.stringify(queueParams)).then(res => {
                    console.log(queueParams)
                    console.log(res.data.status)
                    if(res.data.status==='ok'){
                        alert("创建队列'"+text+"'成功!")
                        this.setState({load:false})
                    }
                }).catch(err => {
                    console.log(err)
                })
            }).catch(err => {
                console.log(err)
            })
        }
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
                                <Grid.Row className="gridRow" columns={3}>
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
                                            <Grid.Row columns={6}>
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
                                                    <Input id="searchBoxleft" placeholder="cm" onChange={this.handleInputChange} name='left'/>
                                                    <em>&nbsp;&nbsp;-&nbsp;&nbsp;</em>
                                                    <Input id="searchBoxright" placeholder="cm" onChange={this.handleInputChange} name='right'/>
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
                                        <Grid.Row >
                                            
                                            <Grid.Column style={{width:'9%'}} >    
                                                <Dropdown text='毛刺征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>毛刺</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非毛刺</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                
                                            </Grid.Column>
                                            <Grid.Column style={{width:'9%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='分叶征' style={{color:'#66cfec'}} id='feaDropdown'>
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
                                            <Dropdown text='密度' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                    <Dropdown.Item onClick={this.handleImageLabels}>实性</Dropdown.Item>
                                                        <Dropdown.Item >半实性</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>磨玻璃</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </Grid.Column>
                                            <Grid.Column style={{width:'12%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='胸膜凹陷征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>胸膜凹陷</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非胸膜凹陷</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                            </Dropdown>
                                            </Grid.Column>
                                            <Grid.Column style={{width:'9%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='空洞征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>空洞</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非空洞</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                            </Dropdown>
                                            </Grid.Column>
                                            <Grid.Column style={{width:'12%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='血管集束征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>血管集束</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非血管集束</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                            </Dropdown>
                                            </Grid.Column>
                                            <Grid.Column style={{width:'9%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='空泡征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>空泡</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非空泡</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                            </Dropdown>
                                            </Grid.Column>
                                            <Grid.Column style={{width:'13%'}} >
                                            {/* <a style={{color:'#66cfec'}} onClick={this.handleLabels}>分叶</a> */}
                                            <Dropdown text='支气管充气征' style={{color:'#66cfec'}} id='feaDropdown'>
                                                    <Dropdown.Menu style={{background:'black'}}>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>支气管充气</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.handleImageLabels}>非支气管充气</Dropdown.Item>
                                                        
                                                    </Dropdown.Menu>
                                            </Dropdown>
                                            </Grid.Column>
                                            
                                        </Grid.Row>
                                    </Grid>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    <Header as='h3' color='grey' style={{marginLeft:12+'%'}}>
                        <Icon name='list' />
                        <Header.Content>列表下载</Header.Content>
                    </Header>
                    <Button inverted color='blue' onClick={this.savetoExcel} id='excelBtn' icon><Icon name='download' size='small'/></Button>   
                    <Grid.Row className="conlabel">
                        <Grid.Column width={2} verticalAlign='middle' textAlign='left'>
                            <Header as='h3' inverted >结节数目:{this.state.totalResults}</Header>
                        </Grid.Column>
                        <Grid.Column verticalAlign='middle'  width={4} textAlign='left'>
                            <Input id='inputQueue' placeholder='请输入队列名称'></Input>
                            <em>&nbsp;&nbsp;&nbsp;&nbsp;</em>
                            {
                                this.state.load===true?
                                <Button 
                                    icon='upload'
                                    className='ui green inverted button' 
                                    size='mini'
                                    onClick={this.handleAddQueues.bind(this)} disabled></Button>
                                :
                                <Button 
                                    icon='add'
                                    className='ui green inverted button' 
                                    size='mini'
                                    onClick={this.handleAddQueues.bind(this)}></Button>
                            }
                            
                        </Grid.Column>
                     
                    </Grid.Row>
                    <Grid.Row >
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12} id="container">
                            {
                                this.state.show===true?
                                <div style={{minHeight:590}}>
                            <Table celled inverted textAlign='center'  id="table" >
                                <Table.Header id='table-header'>
                                    <Table.Row>
                                        <Table.HeaderCell >病人ID</Table.HeaderCell>
                                        <Table.HeaderCell  >性别</Table.HeaderCell>
                                        <Table.HeaderCell  >年龄</Table.HeaderCell>
                                        <Table.HeaderCell  >结节体积(cm³)</Table.HeaderCell>
                                        <Table.HeaderCell  >结节直径(cm)</Table.HeaderCell>
                                        
                                        <Table.HeaderCell>危险程度</Table.HeaderCell>
                                        <Table.HeaderCell>分叶征</Table.HeaderCell>
                                        <Table.HeaderCell>毛刺征</Table.HeaderCell>
                                        <Table.HeaderCell>密度</Table.HeaderCell>
                                        
                                        <Table.HeaderCell>钙化</Table.HeaderCell>
                                        <Table.HeaderCell >胸膜凹陷征</Table.HeaderCell>
                                        <Table.HeaderCell>空洞征</Table.HeaderCell>
                                        <Table.HeaderCell >血管集束征</Table.HeaderCell>
                                        <Table.HeaderCell>空泡征</Table.HeaderCell>
                                        <Table.HeaderCell >支气管充气征</Table.HeaderCell>
                                        <Table.HeaderCell>查看详情</Table.HeaderCell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {lists.map((content, index) => {
                                        // let caseId
                                        // let noduleNo
                                        // console.log('content:',content)
                                        return (
                                            <Table.Row key={index}>
                                                <Table.Cell >{content['病人ID']}</Table.Cell>
                                                <Table.Cell >{content['性别']}</Table.Cell>
                                                <Table.Cell >{content['年龄']}</Table.Cell>
                                                <Table.Cell >{content['结节体积(cm³)']}</Table.Cell>
                                                <Table.Cell >{content['结节直径(cm)']}</Table.Cell>
                                                <Table.Cell >{content['危险程度']}</Table.Cell>
                                                <Table.Cell >{content['分叶征']}</Table.Cell>
                                                <Table.Cell >{content['毛刺征']}</Table.Cell>
                                                <Table.Cell >{content['密度']}</Table.Cell>
                                                <Table.Cell >{content['钙化']}</Table.Cell>
                                                <Table.Cell >{content['胸膜凹陷征']}</Table.Cell>
                                                <Table.Cell >{content['空洞征']}</Table.Cell>
                                                <Table.Cell >{content['血管集束征']}</Table.Cell>
                                                <Table.Cell >{content['空泡征']}</Table.Cell>
                                                <Table.Cell >{content['支气管充气征']}</Table.Cell>
                                                <Table.Cell>
                                                    <Button 
                                                        icon='right arrow'
                                                        className='ui green inverted button' 
                                                        onClick={this.handleLinkClick.bind(this,content['caseId'],content['noduleNo'])}
                                                        size='mini'
                                                        // data-id={dataset}
                                                    ></Button>
                                                </Table.Cell>
                                            </Table.Row>
                                        )
                                    })}
                                    
                                </Table.Body>
                            </Table>
                            <div className="pagination-component">
                                <Pagination
                                    id="pagination"
                                    onPageChange={this.handlePaginationChange}
                                    activePage={this.state.activePage}
                                    totalPages={this.state.totalPage}/>
                            </div>
                            </div>
                            
                                :
                                <div style={{paddingTop: "60px"}}>
                                    <div class="sk-chase">
                                        <div class="sk-chase-dot"></div>
                                        <div class="sk-chase-dot"></div>
                                        <div class="sk-chase-dot"></div>
                                        <div class="sk-chase-dot"></div>
                                        <div class="sk-chase-dot"></div>
                                        <div class="sk-chase-dot"></div>
                                    </div>
                                </div>
                            }
                            
                            </Grid.Column>
                            <Grid.Column width={2}></Grid.Column>
                        </Grid.Row>
                       
                    </Grid>
                    
            </div>
                
            )
        }
        
    }
// }

export default SearchNodulePanel
