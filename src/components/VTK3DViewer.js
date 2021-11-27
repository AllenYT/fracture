import React, { Component } from 'react'
import PropTypes from 'prop-types'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor'
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera'
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker'
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager'
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget'
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource'
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light'
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource'
import vtkPolyLineWidget from 'vtk.js/Sources/Widgets/Widgets3D/PolyLineWidget'
import vtkSplineWidget from 'vtk.js/Sources/Widgets/Widgets3D/SplineWidget'

import { createSub } from '../vtk/lib/createSub.js'

class VTK3DViewer extends Component {
  static propTypes = {
    volumes: PropTypes.array,
    actors: PropTypes.array,
  }

  constructor(props) {
    super(props)
    this.state = {
      viewerWidth: 0,
      viewerHeight: 0,
      moving: false,
      range: {},
      functions: {},
      needReset: false,
    }
    this.subs = {
      pickStart: createSub(),
      pick: createSub(),
      pickEnd: createSub(),
      pickLeftButtonPress: createSub(),
      pickMouseMove: createSub(),
      pickLeftButtonRelease: createSub(),
    }
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
    this.renderer.resetCamera()

    this.camera = this.renderer.getActiveCamera()
    this.camera.elevation(-90)

    // this.widgetManager = vtkWidgetManager.newInstance()
    // this.widgetManager.setRenderer(this.renderer)
    // this.polyLineWidget = vtkPolyLineWidget.newInstance()
    // this.polyLineWidget.placeWidget([
    //     -200, 200,
    //     -350, 50,
    //     -560, -220
    // ])
    // this.widgetManager.addWidget(this.polyLineWidget)
    // this.splineWidget = vtkSplineWidget.newInstance()
    // this.widgetManager.addWidget(this.splineWidget)

    // this.light = vtkLight.newInstance();
    // this.light.setColor(1.0,0.0,0.0);//设置环境光为红色
    // this.renderer.addLight(this.light);//将灯光加入渲染器
    // this.light.setFocalPoint(this.camera.getFocalPoint())
    // this.light.setPosition(this.camera.getPosition())
    //         this.light = vtkLight.newInstance();
    // //         this.light.setColor(0.5,0.5,1.0);//设置环境光为红色
    //         this.light.setColor(1,1,1.0);
    //         this.renderer.addLight(this.light);//将灯光加入渲染器
    //         this.light.setFocalPoint(this.camera.getFocalPoint())
    //         this.light.setPosition(this.camera.getPosition())
    //         this.light.setShadowAttenuation(1)
    //         this.light.setIntensity(0.3)

    this.picker = vtkPicker.newInstance()
    this.interactor = this.renderWindow.getInteractor()
    this.interactorStyle = this.interactor.getInteractorStyle()
    this.interactor.onRightButtonPress((callback) => {
      console.log('rightButtonPress', callback)
      if (this.picker) {
        this.picker.pick([callback.position.x, callback.position.y, callback.position.z], callback.pokedRenderer)
        let picked = this.picker.getPickedPositions()[0]
        console.log('picked', picked)
        // this.props.onRightClick(picked)
      }
    })

    // console.log("interactor", this.interactor)
    this.renderWindow.render()
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.volumes !== this.props.volumes) {
      if (this.props.volumes.length) {
        this.props.volumes.forEach(this.renderer.addVolume)
      } else {
        // TODO: Remove all volumes
      }
      this.renderWindow.render()
    }

    if (prevProps.actors !== this.props.actors) {
      if (this.props.actors.length) {
        this.props.actors.forEach(this.renderer.addActor)
      } else {
        // TODO: Remove all volumes
      }
      if (this.state.needReset) {
        this.renderer.resetCamera()
        this.setState({
          needReset: false,
        })
      }
      this.renderWindow.render()
    }

    if (prevProps.pointActors !== this.props.pointActors) {
      // console.log("this.pointActors",this.props.pointActors)
      if (this.props.pointActors.length) {
        prevProps.pointActors.forEach(this.renderer.removeActor)
        this.props.pointActors.forEach(this.renderer.addActor)
      } else {
      }
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
  zoomIn() {
    this.camera.zoom(1.1)
    this.renderWindow.render()
  }
  zoomOut() {
    this.camera.zoom(0.9)
    this.renderWindow.render()
  }
  resetView() {
    this.renderer.resetCamera()
    this.renderWindow.render()
  }
  setNeedReset() {
    this.setState({
      needReset: true,
    })
  }
  getPicked(x, y) {
    const movePicker = vtkPicker.newInstance()
    movePicker.pick([x, y, 0], this.renderer)
    const picked = movePicker.getPickedPositions()[0]
    return picked
  }
  clearPointActor() {
    this.props.pointActors.forEach(this.renderer.removeActor)
  }
  startPicking() {
    this.interactorStyle.setEnabled(false)
    // this.widgetManager.enablePicking()
    // this.widgetManager.grabFocus(this.splineWidget)

    this.subs.pickLeftButtonPress.sub(
      this.interactor.onLeftButtonPress((callback) => {
        // console.log("leftButtonPress", callback)
        const range = {
          xMax: -Infinity,
          xMin: Infinity,
          yMax: -Infinity,
          yMin: Infinity,
          zMax: -Infinity,
          zMin: Infinity,
        }
        this.setState({
          moving: true,
          range,
        })
      })
    )
    this.subs.pickMouseMove.sub(
      this.interactor.onMouseMove((callback) => {
        // console.log("onMouseMove", callback)
        if (this.state.moving && this.picker) {
          const range = this.state.range
          this.picker.pick([callback.position.x, callback.position.y, callback.position.z], callback.pokedRenderer)
          let picked = this.picker.getPickedPositions()[0]
          if (picked) {
            const x = picked[0]
            const y = picked[1]
            const z = picked[2]
            if (x > range.xMax) {
              range.xMax = x
            }
            if (x < range.xMin) {
              range.xMin = x
            }
            if (y > range.yMax) {
              range.yMax = y
            }
            if (y < range.yMin) {
              range.yMin = y
            }
            if (z > range.zMax) {
              range.zMax = z
            }
            if (z < range.zMin) {
              range.zMin = z
            }
            this.setState({
              range,
            })
          }
        }
      })
    )
    this.subs.pickLeftButtonRelease.sub(
      this.interactor.onLeftButtonRelease((callback) => {
        // console.log("leftButtonRelease", callback)
        this.props.onSelectAirwayRange(this.state.range)
        this.setState({
          moving: false,
        })
      })
    )
  }
  endPicking() {
    this.interactorStyle.setEnabled(true)
    // const pickedPoints = []
    // console.log("widget ", this.polyLineWidget)
    // const handleList = this.polyLineWidget.getWidgetState().getHandleList()

    // handleList.forEach((item) =>{
    //     pickedPoints.push(item.getOrigin())
    // })
    // this.props.onSelectAirwayRangeByWidget(pickedPoints)
    // this.widgetManager.releaseFocus()
    // this.widgetManager.disablePicking()

    // this.viewerWidget = null
    this.subs.pickLeftButtonPress.unsubscribe()
    this.subs.pickMouseMove.unsubscribe()
    this.subs.pickLeftButtonRelease.unsubscribe()
    // this.interactor = vtkRenderWindowInteractor.newInstance()
    // this.interactorStyle = vtkInteractorStyleTrackballCamera.newInstance()
    // this.interactor.setInteractorStyle(this.interactorStyle)
    // this.renderWindow.setInteractor(this.interactor)
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

export default VTK3DViewer
