# LUỒNG XỬ LÝ REQUEST VÀ CÁC SƠ ĐỒ TUẦN TỰ (REQUEST FLOW & SEQUENCE DIAGRAMS)

Tài liệu này mô tả chi tiết luồng di chuyển dữ liệu từ Client qua các phân lớp Router ➔ Middleware ➔ Controller ➔ Service ➔ Model ➔ Database / External Services bằng Mermaid Sequence Diagrams.

---

## 📑 MỤC LỤC
1. [Luồng Xử lý 1: Đăng nhập & Xác thực JWT (Authentication Flow)](#1-luồng-xử-lý-1-đăng-nhập--xác-thực-jwt-authentication-flow)
2. [Luồng Xử lý 2: Quản lý Lớp học & Tài nguyên (Class & Material Flow)](#2-luồng-xử-lý-2-quản-lý-lớp-học--tài-nguyên-class--material-flow)
3. [Luồng Xử lý 3: Nộp Bài tập Đa Tệp đính kèm Cloudinary (Assignment Submission Flow)](#3-luồng-xử-lý-3-nộp-bài-tập-đa-tệp-đính-kèm-cloudinary-assignment-submission-flow)
4. [Luồng Xử lý 4: Thi Trực tuyến & Giám sát Gian lận Real-time (Socket.io Proctoring Flow)](#4-luồng-xử-lý-4-thi-trực-tuyến--giám-sát-gian-lận-real-time-socketio-proctoring-flow)
5. [Luồng Xử lý 5: Sinh JWT Mã hóa RS256 cho Lớp học Live 8x8 JaaS (Jitsi Token Flow)](#5-luồng-xử-lý-5-sinh-jwt-mã-hóa-rs256-cho-lớp-học-live-8x8-jaas-jitsi-token-flow)

---

## 1. LUỒNG XỬ LÝ 1: ĐĂNG NHẬP & XÁC THỰC JWT (AUTHENTICATION FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend React Client
    participant Router as user.routes.js
    participant Validator as loginValidation
    participant Controller as auth.controllers.js
    participant Service as auth.services.js
    participant Model as user.models.js
    participant DB as MongoDB

    Client->>Router: POST /api/auth/login { email, password }
    Router->>Validator: Kiểm tra định dạng email & password
    alt Email hoặc Password trống
        Validator-->>Client: 400 Bad Request { message: "Vui lòng nhập..." }
    else Hợp lệ
        Validator->>Controller: Next()
        Controller->>Service: loginUser({ email, password })
        Service->>Model: findOne({ email, isDeleted: false })
        Model->>DB: Query User Collection
        DB-->>Model: Tra cứu User Document
        Model-->>Service: User Document / null
        alt User không tồn tại
            Service-->>Controller: Throw Error("Email không tồn tại")
            Controller-->>Client: 404 Not Found
        else User tồn tại
            Service->>Service: Bcrypt.compare(password, user.password)
            alt Mật khẩu không đúng
                Service-->>Controller: Throw Error("Mật khẩu không đúng")
                Controller-->>Client: 400 Bad Request
            else Mật khẩu khớp
                Service->>Service: jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '1d' })
                Service-->>Controller: { user, token }
                Controller-->>Client: 200 OK { message, data: { user, token } }
            end
        end
    end
```

---

## 2. LUỒNG XỬ LÝ 2: QUẢN LÝ LỚP HỌC & TÀI NGUYÊN (CLASS & MATERIAL FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Router as class.routes.js
    participant Middleware as auth.middlewares.js (verifyUser)
    participant Controller as class.controller.js
    participant Model as class.model.js
    participant DB as MongoDB

    Client->>Router: GET /api/classes
    Router->>Middleware: verifyUser(req, res, next)
    Middleware->>Middleware: Giải mã Authorization Bearer Token
    alt Token không hợp lệ / Hết hạn
        Middleware-->>Client: 401 Unauthorized
    else Token hợp lệ (req.user = decoded)
        Middleware->>Controller: ClassList(req, res)
        alt req.user.role == 'admin'
            Controller->>Model: find({ isDeleted: false })
        else req.user.role == 'teacher'
            Controller->>Model: find({ teacherId: req.user._id, isDeleted: false })
        else req.user.role == 'student'
            Controller->>Model: find({ students: req.user._id, isDeleted: false })
        end
        Model->>DB: Query Class Collection (Enterprise Soft Delete filter)
        DB-->>Model: Return List of Classes
        Model-->>Controller: Class Documents Array
        Controller-->>Client: 200 OK { message, data: [ ... ] }
    end
```

---

## 3. LUỒNG XỬ LÝ 3: NỘP BÀI TẬP ĐA TỆP ĐÍNH KÈM CLOUDINARY (ASSIGNMENT SUBMISSION FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Frontend
    participant Router as assignment.routes.js
    participant Auth as verifyUser
    participant Multer as upload.array("files", 5)
    participant Cloudinary as Cloudinary CDN Service
    participant Controller as assignment.controller.js
    participant Model as submission.model.js
    participant DB as MongoDB

    Student->>Router: POST /api/assignments/submit/:assignmentId (Multipart Form Data)
    Router->>Auth: verifyUser(req, res, next)
    Auth->>Multer: Next()
    Multer->>Cloudinary: Streams Files to Cloudinary CDN
    Cloudinary-->>Multer: Returns Uploaded File URLs & Public IDs
    Multer->>Controller: submitAssignment(req, res) [req.files populated]
    Controller->>Model: findOneAndUpdate({ assignmentId, studentId: req.user._id }, updateData, { upsert: true })
    Model->>DB: Save Submission Document
    DB-->>Model: Updated Submission Document
    Model-->>Controller: Submission Result
    Controller-->>Student: 200 OK { message: "Nộp bài thành công!", submission }
```

---

## 4. LUỒNG XỬ LÝ 4: THI TRỰC TUYẾN & GIÁM SÁT GIAN LẬN REAL-TIME (SOCKET.IO PROCTORING FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Exam Screen
    participant SocketServer as Socket.io Server (exam.socket.js)
    participant Controller as examAttempt.controller.js
    participant DB as MongoDB (ExamAttempt Collection)
    actor Teacher as Teacher Monitoring Dashboard

    Student->>SocketServer: Socket Connect & emit("join-exam-room", { attemptId, studentId })
    SocketServer->>SocketServer: Add Socket to Room `exam_${attemptId}`
    Teacher->>SocketServer: Socket Connect & emit("join-teacher-monitor", { examId })

    Note over Student: Học sinh rời tab / mở màn hình khác (Tab Switch)
    Student->>Controller: POST /api/exam-attempts/:id/warning { reason: "Chuyển tab" }
    Controller->>DB: Increment cheatCount & push cheatWarning log
    DB-->>Controller: Updated Attempt (cheatCount = N)
    Controller-->>Student: 200 OK { cheatCount: N }

    Student->>SocketServer: emit("cheat-warning-detected", { attemptId, studentName, cheatCount })
    SocketServer->>Teacher: emit("student-cheat-alert", { studentName, cheatCount, time: Now })
    Note over Teacher: Màn hình Giám sát hiển thị cảnh báo đỏ vi phạm thời gian thực
```

---

## 5. LUỒNG XỬ LÝ 5: SINH JWT MÃ HÓA RS256 CHO LỚP HỌC LIVE 8X8 JAAS (JITSI TOKEN FLOW)

```mermaid
sequenceDiagram
    autonumber
    actor User as Teacher / Student Frontend
    participant Router as live.routes.js
    participant Auth as verifyUser
    participant Controller as jaas.controller.js
    participant KeyStorage as keys/jaas_private_key.pk
    participant JWT as JsonWebToken (RS256 Algorithm)

    User->>Router: POST /api/live/jaas-token { roomName: "Class101-Math" }
    Router->>Auth: verifyUser(req, res, next)
    Auth->>Controller: generateJaasToken(req, res)
    Controller->>KeyStorage: Read RSA Private Key File / Env
    KeyStorage-->>Controller: Return Private Key String (`-----BEGIN PRIVATE KEY...`)
    Controller->>JWT: signPayload({ iss: "vpaas-magic-cookie...", sub: AppID, context: { user: { name, email, avatar, moderator } } }, privateKey, { algorithm: "RS256" })
    JWT-->>Controller: Signed JaaS JWT String
    Controller-->>User: 200 OK { success: true, token: "eyJhbGciOiJSUzI1Ni...", roomName, appId }
    User->>User: Initialize 8x8 JaaS External API iframe with Signed JWT
```
