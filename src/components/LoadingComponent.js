import React, { PureComponent } from 'react'

class LoadingComponent extends PureComponent {
  constructor() {
    super()
    this.state = {}
  }
  render() {
    return (
      <div id="loading-panel">
        <div className="sk-chase">
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
        </div>
      </div>
    )
  }
}

export default LoadingComponent
