import axios from 'axios'
import qs from 'qs'

export const getConfigJson = (url) => (dispatch) => {
  dispatch({
    type: 'REQUEST_CONFIG_JSON',
  })
  // const res = await axios.get(url)
  const success = (res) => {
    dispatch({
      type: 'RECEIVE_CONFIG_JSON',
      config: res.data,
    })
  }
  return axios.get(url).then(success)
}

export const getImageIdsByCaseId = (url, caseId) => (dispatch) => {
  return new Promise((resolve, reject) =>
    axios
      .post(
        url,
        qs.stringify({
          caseId,
        })
      )
      .then((res) => {
        dispatch({
          type: 'RECEIVE_IMAGE_IDS',
          imageIds: res.data,
          caseId,
        })
        resolve(res.data)
      })
      .catch((res) => {
        reject(res)
      })
  )
}

export const getNodulesByCaseId = (url, caseId, username) => (dispatch) => {
  return new Promise((resolve, reject) =>
    axios
      .post(
        url,
        qs.stringify({
          caseId,
          username,
        })
      )
      .then((res) => {
        console.log('RECEIVE_NODULES', res)
        dispatch({
          type: 'RECEIVE_NODULES',
          nodules: res.data,
          caseId,
        })
        resolve(res.data)
      })
      .catch((res) => {
        reject(res)
      })
  )
}

export const dropCaseId = (caseId, date, key) => ({
  type: 'DROP_CASE_ID',
  caseId,
  date,
  key,
})

export const setFollowUpActiveTool = (toolName) => ({
  type: 'SET_FOLLOW_UP_ACTIVE_TOOL',
  toolName,
})

export const setFollowUpLoadingCompleted = (loadingCompleted) => ({
  type: 'SET_FOLLOW_UP_LOADING_COMPLETED',
  loadingCompleted,
})

export const setFollowUpPlaying = (isPlaying) => ({
  type: 'SET_FOLLOW_UP_PLAYING',
  isPlaying,
})
