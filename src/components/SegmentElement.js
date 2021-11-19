import React, { Component } from 'react'
import { connect } from 'react-redux'

class SegmentElement extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() {
    window.addEventListener('resize', this.resizeScreen.bind(this))
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeScreen.bind(this))
  }
  componentDidUpdate(prevState, prevProps) {}
  resizeScreen() {}

  render() {
    const { mode } = this.props
    const { viewerWidth, viewerHeight } = this.state
    return (
      <div className="center-viewport-panel" id="segment-container">
        <div style={{ width: viewerWidth, height: viewerHeight }}></div>
      </div>
    )
  }
}

export default connect(
  (state) => ({}),
  (dispatch) => ({})
)(SegmentElement)
