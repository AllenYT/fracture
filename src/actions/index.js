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
      config: res.data
    })
  }
  return axios.get(url).then(success)
}

export const getImageIdsByCaseId = (url, caseId) => (dispatch) => {
  return axios
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
    })
    .catch((res) => {

    })
}
