import React, {Component, createRef} from 'react'

class Info extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        console.log("this.props", this.props)
        if (this.props.type === '1')
            return (
                <div style={{textAlign:"center"}}>
                    <h1 style={{color: "white"}}>
                        病人检索请输入三位及以上字符
                    </h1>
                    <h1 style={{color: "white"}}>
                        日期检索请输入四位及以上字符
                    </h1>
                </div>
            )
        else
            return (
                <div style={{textAlign:"center"}}>
                    something
                </div>
            )
    }
}

export default Info