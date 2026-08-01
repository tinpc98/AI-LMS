export default interface User {
  id?: string;
  name?: string;
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword?: string;
  role?: "student" | "teacher" | "admin";
  terms?: boolean;
}
