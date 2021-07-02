import React, {Component} from 'react'
import { Grid, Checkbox, Message} from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import { Form, Input, Button, Space, Select } from 'antd';
import { MinusCircleTwoTone, PlusOutlined } from '@ant-design/icons';
import {withRouter} from 'react-router-dom'
import '../css/MessagePanel.css'

const { Option } = Select
const { TextArea } = Input



class MessagePanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
            caseId: props.caseId,
            boxes: props.boxes,
            noduleList: []
        }
       
    }

    componentDidMount(){
        let noduleList = []
        for(let i=0;i<this.state.boxes.length;i++){
            noduleList.push(this.state.boxes[i].nodule_no)
        }
        this.setState({noduleList: noduleList})
    }

    render() {
        const {noduleList} = this.state
        return (
            <div>
                 <Form id="messageform" name="dynamic_form_nest_item" autoComplete="off">
                    <Form.List name="users">
                        {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, fieldKey, ...restField }) => (
                            <Space key={key} style={{ display: 'flex', marginBottom: 2 }} align="baseline">
                                <Form.Item
                                {...restField}
                                name={[name, 'noduleNo']}
                                fieldKey={[fieldKey, 'noduleNo']}
                                rules={[{ required: true, message: 'Missing first name' }]}
                                >
                                <Select id="noduleSelect" style={{width:'100px'}}>
                                    {noduleList.map(noduleNo =>(
                                        <Option key={noduleNo} style={{width:'90px'}}>{noduleNo}号结节</Option>
                                    ))}
                                </Select>
                                </Form.Item>
                                <Form.Item
                                {...restField}
                                name={[name, 'message']}
                                fieldKey={[fieldKey, 'message']}
                                rules={[{ required: false}]}
                                >
                                <Input style={{width:'260px'}}
                                // autoSize={{ minRows: 1, maxRows: 2 }}
                                />
                                </Form.Item>
                                <MinusCircleTwoTone  onClick={() => remove(name)} />
                            </Space>
                            ))}
                            <Form.Item>
                            <Button id="addMessage" type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                                新增留言
                            </Button>
                            </Form.Item>
                        </>
                        )}
                    </Form.List>
                    <Form.Item>
                        <Button id="messageSend" type="primary" htmlType="submit" >
                        发送
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        )
    }
}

export default withRouter(MessagePanel)
