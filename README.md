# Lịch trực lễ EPS

Ứng dụng web để các phân xưởng sửa chữa của Công ty EPS lập lịch trực các dịp lễ, theo dõi giờ làm thêm của nhân sự EPS, lưu văn bản pháp lý và xuất các mẫu Excel để in ký: DS tổng hợp (DK01), Tăng cường (DK02), Công xa (DK03), Sơ đồ (DK06), Tổng hợp giờ làm thêm.

- Giao diện: `index.html`, chạy trên GitHub Pages.
- Dữ liệu và đăng nhập: Firebase (Authentication và Cloud Firestore, gói miễn phí Spark).
- Văn bản PDF/ảnh được lưu thẳng trong Firestore nên không cần gói trả phí Cloud Storage.
- Mã nguồn **không chứa** danh sách nhân sự hay số điện thoại. Các dữ liệu này nằm trong Firestore, chỉ người đăng nhập mới đọc được.

## Vai trò tài khoản

| Vai trò | Được làm gì |
|---|---|
| Chủ sở hữu | Toàn quyền, tạo và khóa tài khoản, nhập dữ liệu |
| Quản trị | Xem, sửa, duyệt hoặc trả lại, xuất file |
| Phòng KT-AT | Nhập lịch trực Lãnh đạo và cán bộ các Phòng; tải văn bản mục 1, 2, 3, 5, 6 |
| Phân xưởng (7 tài khoản) | Nhập lịch ca trực, tăng cường, công xa, giờ làm thêm của phân xưởng mình; tải báo cáo mục 4 |
| Chỉ xem | Bảng theo dõi, giờ làm thêm, xem văn bản và tải file |

Quyền được kiểm tra trên máy chủ bằng `firestore.rules`: phân xưởng không sửa được dữ liệu của phân xưởng khác và không tự duyệt được lịch của mình.

## Cài đặt (làm một lần, khoảng 15 phút)

1. **Tạo dự án Firebase**: vào https://console.firebase.google.com → *Add project* → đặt tên, ví dụ `lich-truc-le-eps` (có thể tắt Google Analytics).
2. **Bật đăng nhập**: *Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save*.
3. **Tạo cơ sở dữ liệu**: *Build → Firestore Database → Create database* → chọn vị trí `asia-southeast1 (Singapore)` → *Start in production mode*.
4. **Quy tắc bảo mật**: trong Firestore, mở tab *Rules*, xóa nội dung cũ, dán toàn bộ tệp `firestore.rules` → *Publish*.
5. **Lấy cấu hình web**: *Project settings* (bánh răng) → *Your apps* → biểu tượng `</>` → đặt tên app → *Register app* → sao chép đoạn `firebaseConfig`.
6. **Dán cấu hình**: mở tệp `firebase-config.js` trong repository này → bấm biểu tượng bút chì → thay các giá trị `DIEN_...` bằng cấu hình vừa sao chép → *Commit changes*.
7. **Cho phép tên miền**: *Authentication → Settings → Authorized domains → Add domain* → thêm `ngocnam-eps.github.io`.
8. Mở trang web (đợi 1–2 phút để GitHub Pages cập nhật). Màn hình **Thiết lập lần đầu** hiện ra: tạo tài khoản chủ sở hữu.
9. Vào tab **Dữ liệu** → chọn tệp `du-lieu-ban-dau.json` (được gửi riêng, **không** đưa lên GitHub) → *Nhập dữ liệu*. Tệp này gồm danh sách nhân sự, sơ đồ phối hợp, số điện thoại, danh bạ thuê ngoài và dịp lễ 24/11/2026.
10. Vào tab **Tài khoản** → tạo tài khoản cho 7 phân xưởng, Phòng KT-AT và tài khoản chỉ xem → sao chép mật khẩu, gửi cho từng đơn vị.

## Quy trình mỗi dịp lễ

1. Quản trị tạo dịp lễ (tab *Dịp lễ*), kiểm tra nội dung in (tab *Nội dung in & sơ đồ*).
2. Phòng KT-AT nhập lịch Lãnh đạo và các Phòng, tải văn bản pháp lý, gửi duyệt.
3. Các phân xưởng nhập lịch ca trực (mỗi ca 12 giờ: ca ngày 07h00–19h00, ca đêm 19h00–07h00), tăng cường, công xa, giờ làm thêm lũy kế, tải báo cáo chuẩn bị trước lễ, gửi duyệt.
4. Quản trị duyệt hoặc trả lại.
5. Đủ 8/8 đơn vị đã duyệt: xuất các file Excel để in ký.

Giờ làm thêm chỉ tính cho nhân sự EPS (không tính Ca SCTX và người thuê ngoài), cảnh báo khi vượt 40 giờ/tháng hoặc 300 giờ/năm.

## Giới hạn gói miễn phí

Firestore miễn phí 1 GiB dữ liệu, 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày, đủ cho quy mô 8 đơn vị. Mỗi văn bản tải lên tối đa 20 MB; nên scan PDF ở độ phân giải vừa phải (khoảng 1–3 MB mỗi văn bản).

## Mã nguồn

- `index.html`: ứng dụng đã đóng gói (tạo bằng `src/build_web.py`).
- `src/`: mã nguồn (`ui2.html` giao diện, `core2.js` tính toán và xuất mẫu Excel, `xw.js` bộ ghi tệp .xlsx, `web.js` kết nối Firebase).
- `firestore.rules`: quy tắc bảo mật.
