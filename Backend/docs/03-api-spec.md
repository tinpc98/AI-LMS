# Tài liệu Đặc tả RESTful API (REST API Specification Document)

Tài liệu đặc tả toàn bộ các Endpoints của hệ thống AI-LMS Backend Express Server.

---

## 📑 MỤC LỤC
1. [Quy chuẩn API General Specification](#1-quy-chuẩn-api-general-specification)
2. [Module 1: Authentication & User Management](#2-module-1-authentication--user-management)
3. [Module 2: Course Management](#3-module-2-course-management)
4. [Module 3: Class Management & Enrollment](#4-module-3-class-management--enrollment)
5. [Module 4: Lesson Management](#5-module-4-lesson-management)
6. [Module 5: Assignment & Submission Engine](#6-module-5-assignment--submission-engine)
7. [Module 6: Question Bank & AI Generator](#7-module-6-question-bank--ai-generator)
8. [Module 7: Exam & Proctoring Attempt Engine](#8-module-7-exam--proctoring-attempt-engine)
9. [Module 8: Attendance Tracking](#9-module-8-attendance-tracking)
10. [Module 9: Gradebook & Transcripts](#10-module-9-gradebook--transcripts)
11. [Module 10: Announcements & Notifications](#11-module-10-announcements--notifications)
12. [Module 11: Live Sessions & Video Rooms](#12-module-11-live-sessions--video-rooms)

---

## 1. QUY CHUẨN API GENERAL SPECIFICATION

- **Base URL**: `http://localhost:5000/api` (hoặc domain Production HTTPS)
- **Content-Type**: `application/json` (trừ các API upload file sử dụng `multipart/form-data`)
- **Authentication**: HTTP Header `Authorization: Bearer <accessToken>`
- **Response Format chuẩn**:
  ```json
  {
    "success": true,
    "message": "Thông báo kết quả",
    "data": {},
    "pagination": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  }
  ```

---

## 2. MODULE 1: AUTHENTICATION & USER MANAGEMENT

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `POST` | `/auth/login` | Public | All | `{ email, password }` | `{ accessToken, user: { id, fullName, email, role } }` | `200 OK` | `401` Invalid Credentials<br>`403` Account Disabled |
| `POST` | `/auth/register` | Public | All | `{ fullName, email, password, role }` | `{ success: true, user }` | `201 Created` | `400` Validation Error<br>`409` Email Already Exists |
| `GET` | `/auth/me` | Bearer | All | None | `{ success: true, user }` | `200 OK` | `401` Unauthorized |
| `GET` | `/auth/users` | Bearer | Admin | Query: `search, role, status, page, limit` | `{ data: [User], pagination }` | `200 OK` | `403` Forbidden |
| `POST` | `/auth/users` | Bearer | Admin | `{ fullName, email, password, role, phone }` | `{ success: true, data: User }` | `201 Created` | `400` Bad Request |
| `PUT` | `/auth/users/:id` | Bearer | Admin | Body: `{ fullName, status, role, avatar }` | `{ success: true, data: User }` | `200 OK` | `404` User Not Found |
| `DELETE`| `/auth/users/:id` | Bearer | Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `404` User Not Found |

---

## 3. MODULE 2: COURSE MANAGEMENT

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/courses` | Bearer | All | Query: `search, subject, status, page, limit` | `{ data: [Course], pagination }` | `200 OK` | `500` Internal Error |
| `POST` | `/courses` | Bearer | Admin | `{ courseName, subject, grade, description, tuitionFee }` | `{ success: true, data: Course }` | `201 Created` | `400` Validation Error |
| `GET` | `/courses/:id` | Bearer | All | Params: `id` | `{ success: true, data: Course }` | `200 OK` | `404` Course Not Found |
| `PUT` | `/courses/:id` | Bearer | Admin | Params: `id`, Body: Course Data | `{ success: true, data: Course }` | `200 OK` | `404` Not Found |
| `DELETE`| `/courses/:id` | Bearer | Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `404` Not Found |

---

## 4. MODULE 3: CLASS MANAGEMENT & ENROLLMENT

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/classes` | Bearer | All | Query: `search, courseId, status, page, limit` | `{ data: [Class], pagination }` | `200 OK` | `401` Unauthorized |
| `POST` | `/classes` | Bearer | Admin | `{ className, classCode, courseId, teacherId, maxStudents }` | `{ success: true, data: Class }` | `201 Created` | `400` ClassCode Duplicate |
| `GET` | `/classes/:id` | Bearer | All | Params: `id` | `{ success: true, data: Class }` | `200 OK` | `404` Class Not Found |
| `PUT` | `/classes/:id` | Bearer | Admin/Teacher | Params: `id`, Body: Class updates | `{ success: true, data: Class }` | `200 OK` | `403` Forbidden |
| `DELETE`| `/classes/:id` | Bearer | Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `404` Class Not Found |
| `POST` | `/classes/join` | Bearer | Student| Body: `{ joinCode }` | `{ success: true, data: Class }` | `200 OK` | `400` Class Full / Code Invalid |
| `POST` | `/classes/:id/assign-teacher` | Bearer | Admin | Body: `{ teacherId }` | `{ success: true, data: Class }` | `200 OK` | `404` Teacher Not Found |

---

## 5. MODULE 4: LESSON MANAGEMENT

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/lessons/class/:classId` | Bearer | All | Params: `classId` | `{ success: true, data: [Lesson] }` | `200 OK` | `404` Class Not Found |
| `POST` | `/lessons` | Bearer | Teacher/Admin | `{ title, description, videoUrl, order, classId }` | `{ success: true, data: Lesson }` | `201 Created` | `400` Validation Error |
| `PUT` | `/lessons/:id` | Bearer | Teacher/Admin | Params: `id`, Body: Lesson Data | `{ success: true, data: Lesson }` | `200 OK` | `404` Lesson Not Found |
| `DELETE`| `/lessons/:id` | Bearer | Teacher/Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `403` Forbidden |

---

## 6. MODULE 5: ASSIGNMENT & SUBMISSION ENGINE

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/assignments/class/:classId` | Bearer | All | Params: `classId` | `{ success: true, data: [Assignment] }` | `200 OK` | `401` Unauthorized |
| `POST` | `/assignments` | Bearer | Teacher/Admin | `{ title, description, deadline, classId }` | `{ success: true, data: Assignment }` | `201 Created` | `400` Invalid Deadline |
| `DELETE`| `/assignments/:id` | Bearer | Teacher/Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `404` Assignment Not Found |
| `POST` | `/assignments/:id/submit` | Bearer | Student | Multipart Form: `content, files` | `{ success: true, data: Submission }` | `201 Created` | `400` Deadline Passed |
| `POST` | `/assignments/submission/:id/grade` | Bearer | Teacher/Admin | Body: `{ grade, feedback }` | `{ success: true, data: Submission }` | `200 OK` | `400` Grade Out of Range |

---

## 7. MODULE 6: QUESTION BANK & AI GENERATOR

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/questions` | Bearer | Teacher/Admin | Query: `topic, difficulty, type` | `{ success: true, data: [Question] }` | `200 OK` | `500` Error |
| `POST` | `/questions` | Bearer | Teacher/Admin | `{ content, type, options, correctAnswer, difficulty, topic }` | `{ success: true, data: Question }` | `201 Created` | `400` Invalid Format |
| `DELETE`| `/questions/:id` | Bearer | Teacher/Admin | Params: `id` | `{ success: true, message }` | `200 OK` | `404` Not Found |
| `POST` | `/questions/generate-ai` | Bearer | Teacher/Admin | Body: `{ topic, count, difficulty }` | `{ success: true, data: [Question] }` | `200 OK` | `502` AI Timeout |

---

## 8. MODULE 7: EXAM & PROCTORING ATTEMPT ENGINE

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/exams/class/:classId` | Bearer | All | Params: `classId` | `{ success: true, data: [Exam] }` | `200 OK` | `401` Unauthorized |
| `POST` | `/exams` | Bearer | Teacher/Admin | `{ title, duration, questions: [{questionId, points}], startTime, classId }` | `{ success: true, data: Exam }` | `201 Created` | `400` Total Points != 10.0 |
| `POST` | `/exams/:id/start` | Bearer | Student | Params: `id` | `{ success: true, attempt: ExamAttempt }` | `201 Created` | `400` Exam Closed |
| `POST` | `/exams/attempt/:attemptId/submit` | Bearer | Student | Body: `{ answers: [{questionId, selectedOption, essayText}] }` | `{ success: true, attempt: ExamAttempt }` | `200 OK` | `400` Already Submitted |
| `POST` | `/exams/attempt/:attemptId/cheat-log` | Bearer | Student | Body: `{ cheatType: "TAB_SWITCH" \| "FULLSCREEN_EXIT" }` | `{ success: true, cheatCount }` | `200 OK` | `404` Attempt Not Found |

---

## 9. MODULE 8: ATTENDANCE TRACKING

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/attendances/class/:classId` | Bearer | Teacher/Admin | Params: `classId`, Query: `date` | `{ success: true, data: [Attendance] }` | `200 OK` | `404` Class Not Found |
| `POST` | `/attendances` | Bearer | Teacher/Admin | `{ classId, date, records: [{studentId, status, note}] }` | `{ success: true, count }` | `200 OK` | `400` Validation Error |
| `GET` | `/attendances/student/:studentId` | Bearer | All | Params: `studentId` | `{ success: true, data: [Attendance] }` | `200 OK` | `403` Forbidden |

---

## 10. MODULE 9: GRADEBOOK & TRANSCRIPTS

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/grades/class/:classId` | Bearer | Teacher/Admin | Params: `classId` | `{ success: true, data: [Grade] }` | `200 OK` | `404` Class Not Found |
| `POST` | `/grades` | Bearer | Teacher/Admin | `{ studentId, classId, category, score, weight }` | `{ success: true, data: Grade }` | `201 Created` | `400` Score > 100 |
| `GET` | `/grades/student/:studentId` | Bearer | All | Params: `studentId` | `{ success: true, data: [Grade], gpa }` | `200 OK` | `403` Forbidden |

---

## 11. MODULE 10: ANNOUNCEMENTS & NOTIFICATIONS

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/announcements/class/:classId` | Bearer | All | Params: `classId` | `{ success: true, data: [Announcement] }` | `200 OK` | `401` Unauthorized |
| `POST` | `/announcements` | Bearer | Teacher/Admin | `{ title, content, scope, classId }` | `{ success: true, data: Announcement }` | `201 Created` | `400` Scope Validation |

---

## 12. MODULE 11: LIVE SESSIONS & VIDEO ROOMS

| Method | Endpoint | Auth | Roles | Request Params / Body | Success Response | Status | Error Responses |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: | :--- |
| `GET` | `/live-sessions/class/:classId` | Bearer | All | Params: `classId` | `{ success: true, data: [LiveSession] }` | `200 OK` | `404` Class Not Found |
| `POST` | `/live-sessions` | Bearer | Teacher/Admin | `{ classId, title, scheduledStart }` | `{ success: true, data: LiveSession }` | `201 Created` | `400` Active Room Exists |
