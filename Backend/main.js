// File: main.js
// Entry point mỏng. Toàn bộ phần dựng app nằm ở src/app.js, phần khởi động tiến trình
// nằm ở src/server.js (Wave 2.4). Giữ file này ở gốc để không phải đổi `npm run dev`,
// Dockerfile hay cấu hình deploy đang trỏ tới main.js.
import { startServer } from "./src/server.js";

startServer();
