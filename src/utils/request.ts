import axios from 'axios'

const req = axios.create({
  baseURL: 'https://cxx.smilec.cc',
  // baseURL: 'http://localhost:3001',
})

export default req
