import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sau này em sẽ thêm Interceptors để tự động đính kèm JWT Token tại đây nhé!
export default axiosClient;