import axiosClient from './axiosClient';

export const authApi = {
  register: (registerData: any) => {
    // registerData sẽ chứa: email, password, fullName, role
    return axiosClient.post('/api/auth/register', registerData);
  }
};