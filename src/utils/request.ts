import axios from 'axios'

const req = axios.create({
  // baseURL: 'https://api.moono.cc/v1',
  // baseURL: 'http://localhost:3001/v1',
  baseURL: 'http://121.5.196.193:3001/v1',
})

export default req
