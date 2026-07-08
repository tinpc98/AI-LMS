export default interface User {
  id: string;
  title: string;
  subtitle: number;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher" | "admin";
}
