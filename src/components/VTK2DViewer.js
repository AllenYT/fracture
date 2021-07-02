/*
 * @Author: your name
 * @Date: 2021-03-18 09:22:16
 * @LastEditTime: 2021-06-15 15:53:16
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \deepln-dazhou-new\src\components\VTK2DViewer.js
 */
import React, { Component } from 'react'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkInteractorStyleChannelFragment from '../vtk/VTKViewport/vtkInteractorStyleChannelFragment'
class VTK2DViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.container = React.createRef()
  }

  componentDidMount() {
    this.props.onRef(this)
    this.genericRenderWindow = vtkGenericRenderWindow.newInstance()
    this.genericRenderWindow.setContainer(this.container.current)
    this.glWindow = this.genericRenderWindow.getOpenGLRenderWindow()
    this.renderWindow = this.genericRenderWindow.getRenderWindow()
    this.renderer = this.genericRenderWindow.getRenderer()
    this.renderer.setBackground([0, 0, 0])
    // this.renderer.setBackground([0.59, 0.6, 0.81])
    this.interactor = this.renderWindow.getInteractor()
    this.camera = this.renderer.getActiveCamera()
    // camera's viewup =>
    // camera zoom =>
    // camera azimuth => clockwise direction
    // camera elevation => up direction
    this.camera.elevation(-180)
    this.camera.setViewUp(1, 0, 0)
    // const istyle = vtkInteractorStyleChannelFragment.newInstance();
    // this.renderWindow.getInteractor().setInteractorStyle(istyle);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.volumes !== this.props.volumes) {
      if (this.props.volumes.length) {
        this.renderer.removeAllVolumes()
        this.props.volumes.forEach(this.renderer.addVolume)
        // console.log('channel volumes', this.renderer.getVolumes())
      } else {
        // TODO: Remove all volumes
      }
      // this.renderer.resetCameraClippingRange()
      this.renderer.resetCamera()
      this.camera.zoom(2.0)
      this.renderWindow.render()
    }
    if (prevProps.lineActors !== this.props.lineActors) {
      if (this.props.lineActors.length) {
        this.renderer.removeAllActors()
        this.props.lineActors.forEach(this.renderer.addActor)
      } else {
        // TODO: Remove all volumes
      }
      this.renderer.resetCamera()
      this.renderWindow.render()
    }
  }

  setContainerSize(width, height) {
    if (this.glWindow) {
      this.glWindow.setSize(width, height)
      //console.log("setContainerSize", width, height)
      this.renderWindow.render()
    }
  }

  render() {
    const { viewerStyle } = this.props
    return (
      <div
        style={viewerStyle}
        ref={(input) => {
          this.container.current = input
        }}
      />
    )
  }
}

export default VTK2DViewer
