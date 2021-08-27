import {combineReducers} from 'redux'
import _ from 'lodash'

const configReducer = (state = {config:null}, action) => {
    switch(action.type){
        case 'REQUEST_CONFIG_JSON':
            return{
                ...state,
                fetchingConfigJson: true
            }
        case 'RECEIVE_CONFIG_JSON':
            return {
                ...state,
                fetchingConfigJson: false,
                config: action.config
            }
        default:
            return state
    }
}

const dataCenterReducer = (state = {caseData:[], caseId: null}, action) => {
    const caseData = state.caseData
    let caseDataIndex
    switch(action.type){
        case 'RECEIVE_IMAGE_IDS':
            const imageIds = action.imageIds
            caseDataIndex = _.findIndex(caseData,  { caseId: action.caseId })
            if(caseDataIndex === -1){
                caseData.push({
                    caseId: action.caseId,
                    imageIds
                })
            }else{
                caseData[caseDataIndex].imageIds = imageIds
            }
            // console.log('caseDataItem', caseDataItem)
            return{
                ...state,
                caseData,
                caseId: action.caseId
            }
        case 'RECEIVE_NODULES':
            const nodules = action.nodules
            caseDataIndex = _.findIndex(caseData,  { caseId: action.caseId })
            if(caseDataIndex === -1){
                caseData.push({
                    caseId: action.caseId,
                    nodules
                })
            }else{
                caseData[caseDataIndex].nodules = nodules
            }
            return {
                ...state,
                caseData,
                caseId: action.caseId
            }
        default:
            return state
    }
}

export default combineReducers({
    config: configReducer,
    dataCenter: dataCenterReducer
})