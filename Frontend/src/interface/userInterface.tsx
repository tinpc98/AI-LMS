export default interface User {
  id: string;
  title: string;
  subtitle: number;
  teacher: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher" | "admin";
}
