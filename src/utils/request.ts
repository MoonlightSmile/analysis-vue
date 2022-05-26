import axios from 'axios'

const req = axios.create({
  baseURL: 'http://121.5.196.193:3001',
})

export default req
