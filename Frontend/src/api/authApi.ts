import type User from '../interface/userInterface';
import axiosClient from './axiosClient';

export const authApi = {
  login: (loginData: Pick<User, "email" | "password">) => {
    // Bắn request phương thức POST sang đúng cổng Backend /api/auth/login
    return axiosClient.post('/api/auth/login', loginData); 
  }
};