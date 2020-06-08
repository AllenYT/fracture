import React, { Component } from 'react'
import {Table, Button, Icon, Grid, Tab, Header, Form, Input, Modal} from 'semantic-ui-react'
import ReactDOM from 'react-dom';
import axios from 'axios'
import qs from 'qs'
import '../css/homepagePanel.css'

// import {withRouter, BrowserRouter as Router, Route, Link} from "react-router-dom"

const config = require('../config.json')
const dataConfig = config.data

class HomepagePanel extends Component {
    constructor(props){
        super(props)
        this.state={
            fileList:[]
        }
    this.singlefile = this.singlefile.bind(this)
    this.getFileSize = this.getFileSize.bind(this)
    this.multifile = this.multifile.bind(this)
    this.delFile = this.delFile.bind(this)
    this.upload = this.upload.bind(this)
    }

    componentDidMount(){
        var input = ReactDOM.findDOMNode(this.refs.multi)
        input.setAttribute('webkitdirectory', '')
        input.setAttribute('directory', '')
        input.setAttribute('multiple', '')
        var singleinput = ReactDOM.findDOMNode(this.refs.single)
        singleinput.setAttribute('multiple', '')
        document.getElementById('file_btn').addEventListener('click',function () {
            document.getElementById('singlefile').click();
          });
          
          document.getElementById('folder_btn').addEventListener('click',function () {
            document.getElementById('filefolder').click();
          });

    }

    upload(){
        const files = []
        let fileList = this.state.fileList
        console.log('filelist',fileList)
        const formdata = new FormData()
        for(var i=0;i<fileList.length;i++){
            console.log(fileList[i].content)
            // files.push(fileList[i].content)
            formdata.append('files',fileList[i].content)
        }
        // formdata.append('files',files)
        const params = {
             files : files
        }
        console.log('params',formdata)
        axios.post(dataConfig.uploadMutiply, formdata).then(res => {
            console.log(res.data)
            const successList = res.data.success
            if (successList !== null) {
                
                for(var i=0;i<successList.length;i++){
                    for(var j=0;j<fileList.length;j++){
                        if(successList[i] === fileList[j].fileName){
                            fileList.splice(j, 1)
                        }
                    }
                }
                this.setState({fileList:fileList})
            }
        }).catch(err => {
            console.log('err: ' + err)
        })
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
            <div>
                 <Form enctype="multipart/form-data" >
                    <Form.Field>
                    {/* <label>First Name</label> */}
                    <div id='filelist-tab'>
                        <Table celled inverted id='body-color'>
                            <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell colSpan='3'>文件上传列表</Table.HeaderCell>
                            </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {tableContent}
                            </Table.Body>
                        </Table>
                    </div>
                    
                    {/* <input placeholder='First Name' /> */}
                    <input type="file" name="files" id="singlefile" ref='single' onChange={this.singlefile} style={{display:'none'}} />
                    <input type='file' name='files' id='filefolder' ref='multi' onChange={this.multifile}  style={{display:'none'}}/>
                    </Form.Field>
                    
                    <div class="filefield">
                        <Button.Group>
                            <Button basic id="file_btn" color='blue'>上传文件</Button>
                            <Button basic id="folder_btn" color='blue'>上传文件夹</Button>
                        </Button.Group>
                        
                    </div>
                    <Button type='submit' basic color='green' onClick={this.upload} id="submitfile">上传</Button>
                </Form>
            </div>
        )
    }
       
}

export default HomepagePanel