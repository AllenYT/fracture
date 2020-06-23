import React, { Component } from 'react'
import {Table, Button, Icon, Grid, Tab, Header, Form, Input, Modal, Menu} from 'semantic-ui-react'
import {withRouter, BrowserRouter as Router, Route, Link} from "react-router-dom";
import ReactDOM from 'react-dom';
import axios from 'axios'
import qs from 'qs'
import '../css/preprocess.css'

const config = require('../config.json')
const dataConfig = config.data

class preprocess extends Component {
    constructor(props){
        super(props)
        this.state={
            fileList:[],
            activeItem:'upload',
            status:''
        }
    this.singlefile = this.singlefile.bind(this)
    this.getFileSize = this.getFileSize.bind(this)
    this.multifile = this.multifile.bind(this)
    this.delFile = this.delFile.bind(this)
    this.upload = this.upload.bind(this)
    this.filepath = this.filepath.bind(this)
    }

    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    componentDidMount(){
        var input = ReactDOM.findDOMNode(this.refs.multi)
        input.setAttribute('webkitdirectory', '')
        input.setAttribute('directory', '')
        input.setAttribute('multiple', '')
        var singleinput = ReactDOM.findDOMNode(this.refs.single)
        singleinput.setAttribute('multiple', '')
        var filepath = ReactDOM.findDOMNode(this.refs.path)
        filepath.setAttribute('webkitdirectory', '')
        filepath.setAttribute('directory', '')
        // input.setAttribute('multiple', '')
        // document.getElementById('file_btn').addEventListener('click',function () {
        //     document.getElementById('singlefile').click();
        //   });
          
        // document.getElementById('folder_btn').addEventListener('click',function () {
        //     document.getElementById('filefolder').click();
        // });
        document.getElementById('path_btn').addEventListener('click',function () {
            document.getElementById('filepath').click();
        });
        // document.getElementById('downloadList').style.display='none'
        // document.getElementById('myReviews').style.display='none'
        // document.getElementById('myAnnos').style.display='none'
        // document.getElementById('myqueue').style.display='none'

    }

    upload(){
        const cur_file = document.getElementById("searchprocess").value
        // var filename = document.getElementById("filepath").value;
        console.log('cur',cur_file)
        if(cur_file != undefined){
            const params={
                filepath:cur_file
            }
            axios.post(dataConfig.preprocess, qs.stringify(params)).then(res => {
                console.log(res.data)
                if(res.data.status==='failed')
                this.setState({status:'status:'+res.data.status+' msg:'+res.data.msg})
                else
                this.setState({status:res.data.status})
                
            }).catch(err => {
                console.log('err: ' + err)
            })
        }
    }

    getFileSize(fileByte) {
        var fileSizeByte = fileByte;
        var fileSizeMsg = "";
        if (fileSizeByte < 1048576) fileSizeMsg = (fileSizeByte / 1024).toFixed(2) + "KB";
        else if (fileSizeByte == 1048576) fileSizeMsg = "1MB";
        else if (fileSizeByte > 1048576 && fileSizeByte < 1073741824) fileSizeMsg = (fileSizeByte / (1024 * 1024)).toFixed(2) + "MB";
        else if (fileSizeByte > 1048576 && fileSizeByte == 1073741824) fileSizeMsg = "1GB";
        else if (fileSizeByte > 1073741824 && fileSizeByte < 1099511627776) fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024)).toFixed(2) + "GB";
        else if (fileSizeByte > 1073741824 && fileSizeByte == 1099511627776) fileSizeMsg = "1TB";
        else if (fileSizeByte > 1099511627776 && fileSizeByte < 1125899906842624) fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024 * 1024)).toFixed(2) + "TB";
        else fileSizeMsg = "文件超过1PB";
        return fileSizeMsg;
      }

    singlefile(e){
        const current_file = e.target.files[0]
        console.log('cur',current_file)
        if(current_file != undefined){
            let newfile_no = 0
            let filesize = 0
            let filename = ''
            let fileList = this.state.fileList
            for (var i = 0; i < fileList.length; i++) {
                const current_file_no = parseInt(fileList[i].file_no)
                if (current_file_no > newfile_no) {
                    newfile_no = current_file_no
                }
            }
            filesize = this.getFileSize(current_file.size)
            filename = current_file.name
            const newfile = {
                "file_no": (1 + newfile_no).toString(),
                "fileName":filename,
                "fileSize":filesize,
                "content":current_file
            }
            console.log("newfile",newfile)
            fileList.push(newfile)
            this.setState({fileList:fileList})
        }
        
    }

    filepath(e){
        const cur_file = e.target.files
        // var filename = document.getElementById("filepath").value;
        console.log('cur',cur_file)
        if(cur_file != undefined){
            var filename = cur_file[0]
            console.log('curfilename',filename['webkitRelativePath'].split('/')[0])
            const params={
                filepath:filename['webkitRelativePath'].split('/')[0]
            }
            axios.post(dataConfig.preprocess, qs.stringify(params)).then(res => {
                console.log(res.data)
                if(res.data.status==='failed')
                this.setState({status:'status:'+res.data.status+' msg:'+res.data.msg})
                else
                this.setState({status:res.data.status})
                
                
            }).catch(err => {
                console.log('err: ' + err)
            })
        }
    }

    multifile(e){
        const current_folder = e.target.files
        console.log('curfloder',current_folder)
        let newfile_no = 0
        let filesize = 0
        let filename = ''
        let fileList = this.state.fileList
        for (var i = 0; i < fileList.length; i++) {
            const current_file_no = parseInt(fileList[i].file_no)
            if (current_file_no > newfile_no) {
                newfile_no = current_file_no
            }
        }
        for(var i=0;i<current_folder.length;i++){       
            filesize = filesize + current_folder[i]["size"]
        }
        filesize = this.getFileSize(filesize)
        filename = current_folder[0]['webkitRelativePath'].split('/')[0]
        const newfolder = {
            "file_no": newfile_no,
            "fileName":filename,
            "fileSize":filesize,
            "content":current_folder
        }
        console.log("newfolder",newfolder)
        fileList.push(newfolder)
        this.setState({fileList:fileList})
    }

    delFile(e){
        const delId = e.target.id
        const file_no = delId.split("-")[1]
        let fileList = this.state.fileList
        for (var i = 0; i < fileList.length; i++) {
            if (fileList[i].file_no === parseInt(file_no)) {
                fileList.splice(i, 1)
            }
        }
        console.log('filelist',fileList)
        this.setState({
            fileList: fileList
        })
    }

    render() {
        let tableContent = ""
        const { activeItem } = this.state
        tableContent = this
                .state
                .fileList
                .map((inside, idx) => {
                    // console.log(this.state.currentIdx, inside.slice_idx - 1)
                    let classNamee = ""
                    const delId = 'del-' + inside.file_no
                    return (
                        <Table.Row key={idx} className={classNamee}>
                            <Table.Cell>
                                {inside.fileName}
                            </Table.Cell>
                            <Table.Cell>
                               {inside.fileSize}
                            </Table.Cell>
                            <Table.Cell><a onClick={this.delFile} id={delId}>删除</a></Table.Cell>
                            
                        </Table.Row>
                    )
                })

        return(
            <div id='homepagePanel'>
                    <Grid divided='vertically'>
                        <Grid.Row stretched id='homepageMenu'>
                            <Grid.Column width='12'>
                               <div id='upload'>
                                 <Form enctype="multipart/form-data" >
                                    <Form.Field>
                                    {/* <label>First Name</label> */}
                                    <div id='filelist-tab'>
                                        <Table celled inverted id='body-color'>
                                            <Table.Header>
                                            <Table.Row>
                                                <Table.HeaderCell colSpan='3'>点击文件路径按钮进行预处理;或在文本框输入文件路径后，点击上传进行预处理</Table.HeaderCell>
                                            </Table.Row>
                                            </Table.Header>

                                            <Table.Body>
                                                {tableContent}
                                            </Table.Body>
                                        </Table>
                                    </div>
                                    
                                    {/* <input placeholder='First Name' /> */}
                                    <input type="file" name="files" id="singlefile" ref='single' onChange={this.singlefile} style={{display:'none'}} />
                                    <input type="file" name="files" id="filepath" ref='path' onChange={this.filepath} style={{display:'none'}} />
                                    <input type='file' name='files' id='filefolder' ref='multi' onChange={this.multifile}  style={{display:'none'}}/>
                                    </Form.Field>
                                    
                                    <div class="filefield" style={{textAlign:'center'}}>
                                        
                                            {/* <Button basic id="file_btn" color='blue'>上传文件</Button>
                                            <Button basic id="folder_btn" color='blue'>上传文件夹</Button> */}
                                            <Button basic id="path_btn" color='green'>文件路径</Button>
                                        
                                    </div>
                                    <div style={{marginLeft:20}}>
                                        <Input placeholder='请输入路径' id="searchprocess"></Input>
                                        <Button inverted color='green' onClick={this.upload}>上传</Button>
                                    </div>
                                    <div>
                                        <Header size='huge' color='white' inverted>{this.state.status}</Header>
                                    </div>
                                </Form>
                               </div>
                               
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                
            </div>
        )
    }
    componentDidUpdate(prevProps, prevState){
        
    }

       
}

export default preprocess