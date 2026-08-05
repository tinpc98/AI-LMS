export default interface User {
  id?: string;
  _id?: string;
  name?: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: "student" | "teacher" | "admin";
  terms?: boolean;
}
