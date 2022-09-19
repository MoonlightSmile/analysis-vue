import axios from 'axios'

const req = axios.create({
  baseURL: 'https://api.moono.cc/v1',
})

export default req
