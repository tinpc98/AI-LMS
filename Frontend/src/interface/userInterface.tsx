export default interface User{
    name: string,
    fullName: string,
    phone: number,
    email: string,
    password: string,
    confirmPassword: string,
    role: "student" | "teacher" | "admin";
}