import axios from 'axios'

const req = axios.create({
  baseURL: 'https://cxx.smilec.cc/v1',
  // baseURL: 'http://localhost:3001/v1',
})

export default req
