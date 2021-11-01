import React, { Component } from 'react'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer'
import vtkWidgetManager from 'vtk.js/Sources/Widgets/Core/WidgetManager'
import vtkPaintFilter from 'vtk.js/Sources/Filters/General/PaintFilter'
import vtkPaintWidget from 'vtk.js/Sources/Widgets/Widgets3D/PaintWidget'

import { ViewTypes } from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants'
import { createSub } from '../vtk/lib/createSub.js'
import createLabelPipeline from '../vtk/VTKViewport/createLabelPipeline'
import vtkSVGWidgetManager from '../vtk/VTKViewport/vtkSVGWidgetManager'

class VTKMaskViewer extends Component {
  static defaultProps = {
    painting: false,
    labelmapRenderingOptions: {
      visible: true,
      renderOutline: true,
      segmentsDefaultProperties: [],
      onNewSegmentationRequested: () => {},
    },
    showRotation: false,
  }

  constructor(props) {
    super(props)
    this.genericRenderWindow = null
    this.widgetManager = vtkWidgetManager.newInstance()
    this.state = {}
    this.container = React.createRef()
    this.subs = {
      interactor: createSub(),
      data: createSub(),
      labelmap: createSub(),
      paint: createSub(),
      paintStart: createSub(),
      paintEnd: createSub(),
    }
  }

  componentDidMount() {
    this.props.onRef(this)
    this.genericRenderWindow = vtkGenericRenderWindow.newInstance({
      background: [0, 0, 0],
    })
    this.genericRenderWindow.setContainer(this.container.current)
    this.glWindow = this.genericRenderWindow.getOpenGLRenderWindow()
    this.renderWindow = this.genericRenderWindow.getRenderWindow()
    this.renderer = this.genericRenderWindow.getRenderer()

    this.paintRenderer = vtkRenderer.newInstance()
    this.renderWindow.addRenderer(this.paintRenderer)
    this.renderWindow.setNumberOfLayers(2)
    this.paintRenderer.setLayer(1)
    this.paintRenderer.setInteractive(false)
    this.glWindow.buildPass(true)

    const radius = 5
    const label = 1
    this.widgetManager.disablePicking()
    this.widgetManager.setRenderer(this.paintRenderer)
    this.paintWidget = vtkPaintWidget.newInstance()
    this.paintWidget.setRadius(radius)
    this.paintFilter = vtkPaintFilter.newInstance()
    this.paintFilter.setLabel(label)
    this.paintFilter.setRadius(radius)

    // this.svgWidgetManager = vtkSVGWidgetManager.newInstance()
    // this.svgWidgetManager.setRenderer(this.renderer)
    // this.svgWidgetManager.setScale(1)

    // this.renderer.setBackground([0.59, 0.6, 0.81])
    this.interactor = this.renderWindow.getInteractor()
    this.interactorStyle = this.interactor.getInteractorStyle()

    this.camera = this.renderer.getActiveCamera()
    this.camera.setParallelProjection(true)

    this.camera.elevation(-180)
    this.camera.setViewUp(0, -1, 0)

    const updateCameras = () => {
      const baseCamera = this.renderer.getActiveCamera()
      const paintCamera = this.paintRenderer.getActiveCamera()

      const position = baseCamera.getReferenceByName('position')
      const focalPoint = baseCamera.getReferenceByName('focalPoint')
      const viewUp = baseCamera.getReferenceByName('viewUp')
      const viewAngle = baseCamera.getReferenceByName('viewAngle')

      paintCamera.set({
        position,
        focalPoint,
        viewUp,
        viewAngle,
      })
    }
    // TODO unsubscribe from this before component unmounts.
    this.interactor.onAnimation(updateCameras)
    updateCameras()
    this.componentDidUpdate({})
    if (this.props.parallelScale) {
      // exactly match the window size
      this.camera.setParallelScale(this.props.parallelScale)
      this.renderWindow.render()
    }
    // this.interactorStyle.onModified(() => {
    //   this.updatePaintbrush()
    // })
    // this.updatePaintbrush()
  }

  updatePaintbrush() {
    const manip = this.paintWidget.getManipulator()
    const handle = this.paintWidget.getWidgetState().getHandle()
    const camera = this.paintRenderer.getActiveCamera()
    const normal = camera.getDirectionOfProjection()
    // manip.setNormal(...normal)
    manip.setNormal(...this.renderWindow.getInteractor().getInteractorStyle().getSliceNormal())
    manip.setOrigin(...camera.getFocalPoint())
    handle.rotateFromDirections(handle.getDirection(), normal)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.maskWidth !== this.props.maskWidth || prevProps.maskHeight !== this.props.maskHeight) {
      this.setContainerSize(this.props.maskWidth, this.props.maskHeight)
    }
    if (prevProps.volumes !== this.props.volumes) {
      if (this.props.volumes.length) {
        this.renderer.removeAllVolumes()
        this.props.volumes.forEach(this.renderer.addVolume)
        console.log('mask volumes differ', this.renderer.getVolumes())
      } else {
        // TODO: Remove all volumes
      }
      // this.renderer.resetCameraClippingRange()
      this.renderer.resetCamera()
      this.setParallelScale(this.props.parallelScale)
    }

    if (!prevProps.paintFilterBackgroundImageData && this.props.paintFilterBackgroundImageData) {
      // re-render if data has updated
      this.subs.data.sub(
        this.props.paintFilterBackgroundImageData.onModified(() => {
          this.genericRenderWindow.resize()
          this.renderWindow.render()
        })
      )
      this.paintFilter.setBackgroundImage(this.props.paintFilterBackgroundImageData)
    } else if (prevProps.paintFilterBackgroundImageData && !this.props.paintFilterBackgroundImageData) {
      this.paintFilter.setBackgroundImage(null)
      this.subs.data.unsubscribe()
    }

    if (prevProps.paintFilterLabelMapImageData !== this.props.paintFilterLabelMapImageData && this.props.paintFilterLabelMapImageData) {
      this.subs.labelmap.unsubscribe()

      // Remove actors.
      if (this.labelmap && this.labelmap.actor) {
        this.renderer.removeVolume(this.labelmap.actor)

        if (this.api) {
          const { actors } = this.api

          const index = actors.findIndex((actor) => actor === this.labelmap.actor)

          if (index !== -1) {
            actors.splice(index, 1)
          }
        }
      }

      const labelmapImageData = this.props.paintFilterLabelMapImageData

      const labelmap = createLabelPipeline(this.props.paintFilterBackgroundImageData, labelmapImageData, this.props.labelmapRenderingOptions)

      this.labelmap = labelmap

      // this.props.labelmapRenderingOptions.segmentsDefaultProperties.forEach((properties, segmentNumber) => {
      //   if (properties) {
      //     this.setSegmentVisibility(segmentNumber, properties.visible)
      //   }
      // })

      // Add actors.
      if (this.labelmap && this.labelmap.actor) {
        this.renderer.addVolume(this.labelmap.actor)

        // console.log("label map", this.renderer.getVolumes())
        if (this.api) {
          this.api.actors = this.api.actors.concat(this.labelmap.actor)
        }
      }

      labelmap.mapper.setInputConnection(this.paintFilter.getOutputPort())

      // You can update the labelmap externally just by calling modified()
      this.paintFilter.setLabelMap(labelmapImageData)
      this.subs.labelmap.sub(
        labelmapImageData.onModified(() => {
          labelmap.mapper.modified()

          this.renderWindow.render()
        })
      )

      this.genericRenderWindow.resize()
    }

    // if (prevProps.labelmapRenderingOptions && prevProps.labelmapRenderingOptions.visible !== this.props.labelmapRenderingOptions.visible) {
    //   this.labelmap.actor.setVisibility(prevProps.labelmapRenderingOptions.visible)
    // }

    if (prevProps.painting !== this.props.painting) {
      if (this.props.painting) {
        this.viewWidget = this.widgetManager.addWidget(this.paintWidget, ViewTypes.SLICE)
        this.subs.paintStart.sub(
          this.viewWidget.onStartInteractionEvent(() => {
            this.paintFilter.startStroke()
            this.paintFilter.addPoint(this.paintWidget.getWidgetState().getTrueOrigin())
            if (this.props.onPaintStart) {
              this.props.onPaintStart()
            }
          })
        )
        this.subs.paint.sub(
          this.viewWidget.onInteractionEvent(() => {
            if (this.viewWidget.getPainting()) {
              this.paintFilter.addPoint(this.paintWidget.getWidgetState().getTrueOrigin())
              if (this.props.onPaint) {
                this.props.onPaint()
              }
            }
          })
        )
        this.subs.paintEnd.sub(
          this.viewWidget.onEndInteractionEvent(() => {
            const strokeBufferPromise = this.paintFilter.endStroke()

            if (this.props.onPaintEnd) {
              strokeBufferPromise.then((strokeBuffer) => {
                this.props.onPaintEnd(strokeBuffer, this.props.viewerType)
              })
            }
          })
        )

        this.widgetManager.grabFocus(this.paintWidget)
        this.widgetManager.enablePicking()

        this.genericRenderWindow.resize()
      } else if (this.viewWidget) {
        this.widgetManager.releaseFocus()
        this.widgetManager.removeWidget(this.paintWidget)
        this.widgetManager.disablePicking()

        this.subs.paintStart.unsubscribe()
        this.subs.paint.unsubscribe()
        this.subs.paintEnd.unsubscribe()
        this.viewWidget = null

        this.genericRenderWindow.resize()
      }
    }
  }

  setContainerSize(width, height) {
    if (this.glWindow) {
      console.log('camera', this.camera.getState())
      this.glWindow.setSize(width, height)
      //console.log("setContainerSize", width, height)
      this.renderWindow.render()
    }
  }
  setParallelScale(parrallelScale) {
    if (this.camera) {
      this.camera.setParallelScale(parrallelScale)
      this.renderWindow.render()
    }
  }
  setPaintFilterLabel(label) {
    this.paintFilter.setLabel(label)
  }
  setPaintFilterRadius(radius) {
    this.paintWidget.setRadius(radius)
    this.paintFilter.setRadius(radius)
  }
  setSegmentRGB(segmentIndex, [red, green, blue]) {
    const { labelmap } = this

    labelmap.cfun.removePoint(segmentIndex)
    labelmap.cfun.addRGBPoint(segmentIndex, red / 255, green / 255, blue / 255)
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

export default VTKMaskViewer
