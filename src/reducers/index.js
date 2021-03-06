import { combineReducers } from 'redux'
import _ from 'lodash'

const configReducer = (state = { config: null }, action) => {
  switch (action.type) {
    case 'REQUEST_CONFIG_JSON':
      return {
        ...state,
        fetchingConfigJson: true,
      }
    case 'RECEIVE_CONFIG_JSON':
      return {
        ...state,
        fetchingConfigJson: false,
        config: action.config,
      }
    default:
      return state
  }
}

const dataCenterReducer = (state = { caseData: [], caseId: null, loadedImages: {} }, action) => {
  const caseData = state.caseData
  const loadedImages = state.loadedImages
  let caseDataIndex
  switch (action.type) {
    case 'RECEIVE_IMAGE_IDS':
      const imageIds = action.imageIds
      caseDataIndex = _.findIndex(caseData, { caseId: action.caseId })
      if (caseDataIndex === -1) {
        caseData.push({
          caseId: action.caseId,
          imageIds,
          nodules: [],
        })
      } else {
        caseData[caseDataIndex].imageIds = imageIds
      }
      // console.log('caseDataItem', caseDataItem)
      return {
        ...state,
        caseData,
        caseId: action.caseId,
      }
    case 'RECEIVE_NODULES':
      const nodules = action.nodules
      caseDataIndex = _.findIndex(caseData, { caseId: action.caseId })
      if (caseDataIndex === -1) {
        caseData.push({
          caseId: action.caseId,
          imageIds: [],
          nodules,
        })
      } else {
        caseData[caseDataIndex].nodules = nodules
      }
      return {
        ...state,
        caseData,
        caseId: action.caseId,
      }
    case 'DROP_CASE_ID':
      if (action.key === 0) {
        let preDate = state.preDate
        if (action.date < preDate) {
          return {
            ...state,
            curCaseId: state.preCaseId,
            curDate: state.preDate,
            preCaseId: action.caseId,
            preDate: action.date,
          }
        } else {
          return {
            ...state,
            curCaseId: action.caseId,
            curDate: action.date,
          }
        }
      } else if (action.key === 1) {
        let curDate = state.curDate
        if (action.date > curDate) {
          return {
            ...state,
            preCaseId: state.curCaseId,
            preDate: state.curDate,
            curCaseId: action.caseId,
            curDate: action.date,
          }
        } else {
          return {
            ...state,
            preCaseId: action.caseId,
            preDate: action.date,
          }
        }
      } else {
        return {
          ...state,
        }
      }
    case 'SET_FOLLOW_UP_ACTIVE_TOOL':
      return {
        ...state,
        followUpActiveTool: action.toolName,
      }
    case 'SET_FOLLOW_UP_LOADING_COMPLETED':
      return {
        ...state,
        followUpLoadingCompleted: action.loadingCompleted,
      }
    case 'SET_FOLLOW_UP_PLAYING':
      return {
        ...state,
        followUpisPlaying: action.isPlaying,
      }
    case 'UPDATE_LOADED_IMAGE_NUMBER':
      const loadedImageIndex = action.loadedImageIndex
      if (loadedImages[action.caseId] === undefined) {
        loadedImages[action.caseId] = {}
      }
      loadedImages[action.caseId][loadedImageIndex] = 1
      return {
        ...state,
        loadedImages,
        needUpdateLoadedImages: _.random(0, 100),
      }
    default:
      return state
  }
}

export default combineReducers({
  config: configReducer,
  dataCenter: dataCenterReducer,
})
