import React, { Component } from 'react'
import { Select } from 'antd'
import { Dropdown } from 'semantic-ui-react'
const { Option } = Select
const children = []
for (let i = 10; i < 36; i++) {
  children.push(<Option key={i.toString(36) + i}>{i.toString(36) + i}</Option>)
}
function handleChange(value) {
  console.log(`selected ${value}`)
}
const friendOptions = [
  {
    key: 'Jenny Hess',
    text: 'Jenny Hess',
    value: 'Jenny Hess',
    image: { avatar: true, src: '/images/avatar/small/jenny.jpg' },
  },
  {
    key: 'Elliot Fu',
    text: 'Elliot Fu',
    value: 'Elliot Fu',
    image: { avatar: true, src: '/images/avatar/small/elliot.jpg' },
  },
  {
    key: 'Stevie Feliciano',
    text: 'Stevie Feliciano',
    value: 'Stevie Feliciano',
    image: { avatar: true, src: '/images/avatar/small/stevie.jpg' },
  },
  {
    key: 'Christian',
    text: 'Christian',
    value: 'Christian',
    image: { avatar: true, src: '/images/avatar/small/christian.jpg' },
  },
  {
    key: 'Matt',
    text: 'Matt',
    value: 'Matt',
    image: { avatar: true, src: '/images/avatar/small/matt.jpg' },
  },
  {
    key: 'Justen Kitsune',
    text: 'Justen Kitsune',
    value: 'Justen Kitsune',
    image: { avatar: true, src: '/images/avatar/small/justen.jpg' },
  },
]
class Test extends Component {
  constructor() {
    super()
  }
  render() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto' }}>
          <div style={{ overflowY: 'auto' }}>
            <Select mode="multiple" allowClear style={{ width: '100%' }} placeholder="Please select" defaultValue={['a10', 'c12']} onChange={handleChange}>
              {children}
            </Select>
          </div>
        </div>
        <div style={{ height: '500px', width: '100%', backgroundColor: 'black', color: 'white' }}>
          Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo Heloo
        </div>
      </div>
    )
  }
}

export default Test
