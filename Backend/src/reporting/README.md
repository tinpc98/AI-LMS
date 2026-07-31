# `src/reporting/` — tầng đọc tổng hợp

> Đây **không** phải một module nghiệp vụ. Nó là một **tầng** riêng, ngang hàng với
> `src/modules/`, có quy tắc phụ thuộc riêng được enforce bằng dependency-cruiser.

## Vì sao không biến thành module như `analytics`, `dashboard`, `report`?

Khi migrate Wave 3, ba thứ này là phần cuối cùng còn lại. Cách dễ nhất là ép chúng thành
ba module nữa cho "đồng bộ". Nhưng nhìn vào phụ thuộc thật thì thấy ngay vấn đề —
`analytics.service.js` import từ **9 module khác nhau**:

```
#modules/class      #modules/lesson    #modules/badge
#modules/attendance #modules/grade     #modules/assignment
#modules/exam-attempt                  #modules/exam
```

Nếu đây là module, ta có một module phụ thuộc vào gần như **toàn bộ** module còn lại.
Điều đó phá đúng tính chất mà 17 module kia vừa đạt được: mỗi module là một đơn vị có
thể hiểu, test và tách rời độc lập.

Bản chất của ba thứ này khác hẳn module nghiệp vụ:

| | Module nghiệp vụ | Tầng reporting |
|---|---|---|
| Sở hữu dữ liệu | có (model riêng) | **không** — chỉ đọc |
| Ghi dữ liệu | có | **không** |
| Số module phụ thuộc | 0–3 | 4–9 |
| Có thể tách thành service riêng | có | không (mất hết nguồn dữ liệu) |

Chúng chỉ **đọc** dữ liệu từ nhiều module để dựng báo cáo. Đó là đặc trưng của một tầng
đọc (read model), không phải của một miền nghiệp vụ.

## Quy tắc phụ thuộc

```
reporting  ──đọc──>  modules        ✅ cho phép (qua public API index.js)
modules    ──────>  reporting       ❌ CẤM
```

Chiều cấm là quan trọng nhất: nếu một module nghiệp vụ bắt đầu import từ `reporting/`,
nghĩa là logic báo cáo đã rò ngược vào nghiệp vụ, và ta mất khả năng tách module đó ra.
Rule `no-modules-to-reporting` trong `.dependency-cruiser.cjs` chặn điều này ở mức
**error**, tức chặn merge.

## Nếu sau này cần ghi dữ liệu

Nếu một tính năng báo cáo cần **ghi** (ví dụ lưu snapshot báo cáo định kỳ), đừng viết
lệnh ghi ở đây. Hãy tạo model cho nó trong một module nghiệp vụ thật, hoặc dựng module
`report-snapshot` riêng. Tầng này giữ nguyên tính chất chỉ-đọc thì mới còn giá trị.
