// ── FIREBASE CONFIG ──
let dragBooking = null;

let pendingTargetTime = null;
let pendingTargetCar = null;
let pendingActionType = null; // 'delete_form', 'delete_quick', 'move'
let pendingItemData = null;

const firebaseConfig = {
    apiKey: "AIzaSyDppkqjWkRyL_JYFrHF7MWvTFAACwgxU-c",
    authDomain: "bus-boking-283a9.firebaseapp.com",
    databaseURL: "https://bus-boking-283a9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bus-boking-283a9",
    storageBucket: "bus-boking-283a9.firebasestorage.app",
    messagingSenderId: "536319278949",
    appId: "1:536319278949:web:3bf4ce8021e2b326086b8c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── ELEMENTS ──
const reserveBtns = document.querySelectorAll(".reserve-btn");
const popup = document.getElementById("reservePopup");
const closePopup = document.getElementById("closePopup");
const deleteBtn = document.getElementById("deleteBtn");
const reserveForm = document.getElementById("reserveForm");
const adminDate = document.getElementById("adminDate");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const updateBtn = document.getElementById("updateBtn");

const btnPageEarly = document.getElementById("btnPageEarly");
const btnPageLate = document.getElementById("btnPageLate");
const pageEarlyView = document.getElementById("pageEarlyView");
const pageLateView = document.getElementById("pageLateView");

// Password Elements
const passwordPopup = document.getElementById("passwordPopup");
const pwdInput = document.getElementById("pwdInput");
const pwdCancelBtn = document.getElementById("pwdCancelBtn");
const pwdConfirmBtn = document.getElementById("pwdConfirmBtn");

// Form fields
const inputRoom = document.getElementById("inputRoom");
const inputName = document.getElementById("inputName");
const inputNote = document.getElementById("inputNote");
const selAdults = document.getElementById("selAdults");
const selSoinet = document.getElementById("selSoinet");
const btnSeatAri = document.getElementById("btnSeatAri");
const btnSeatNashi = document.getElementById("btnSeatNashi");
const stayToggle = document.getElementById("stayToggle");
const lugTokudai = document.getElementById("lugTokudai");
const lugLarge = document.getElementById("lugLarge");
const lugMedium = document.getElementById("lugMedium");
const lugSmall = document.getElementById("lugSmall");
const searchInput = document.getElementById("searchInput");
const showAllBookingsBtn =
    document.getElementById("showAllBookingsBtn");

const allBookingsPopup =
    document.getElementById("allBookingsPopup");

const allBookingsList =
    document.getElementById("allBookingsList");

const closeAllBookingsBtn =
    document.getElementById("closeAllBookingsBtn");

let currentReservationRef = null;
let soinetSeatStatus = "";
let stayActive = false;

const seatMap = {
    "06:05_ラッキータクシー": 8, "06:05_ホテル": 6,
    "06:20_ラッキータクシー": 8, "06:20_ホテル": 6,
    "06:40_ラッキータクシー": 8, "06:40_ホテル": 6,
    "07:00_ラッキータクシー": 8, "07:00_ホテル": 6,
    "07:30_ホテル": 6, "08:00_ホテル": 6, "08:30_ホテル": 6,
    "09:00_ホテル": 6, "09:30_ホテル": 6, "10:00_ホテル": 6
};

// ── TRANG TOGGLE ──
document.addEventListener("DOMContentLoaded", () => {
    // Hàm xử lý chuyển sang ca sớm (06:05 ～ 07:00)
    const switchToEarly = () => {
        btnPageEarly.classList.add("active");
        btnPageLate.classList.remove("active");
        pageEarlyView.classList.remove("hidden");
        pageLateView.classList.add("hidden");
    };

    // Hàm xử lý chuyển sang ca muộn (07:30 ～ 10:00)
    const switchToLate = () => {
        btnPageLate.classList.add("active");
        btnPageEarly.classList.remove("active");
        pageLateView.classList.remove("hidden");
        pageEarlyView.classList.add("hidden");
    };

    // Xử lý sự kiện click chuột bình thường
    btnPageEarly.addEventListener("click", switchToEarly);
    btnPageLate.addEventListener("click", switchToLate);

    // 🌟 TỰ ĐỘNG CHUYỂN TRANG KHI KÉO THẢ (Hỗ trợ PC & iPad)
    // Khi đang kéo khách và rê chuột/ngón tay đè lên nút Ca sớm
    btnPageEarly.addEventListener("dragover", (e) => {
        e.preventDefault(); // Bắt buộc phải có để cho phép thả dữ liệu
        if (dragBooking) {
            switchToEarly();
        }
    });

    // Khi đang kéo khách và rê chuột/ngón tay đè lên nút Ca muộn
    btnPageLate.addEventListener("dragover", (e) => {
        e.preventDefault(); // Bắt buộc phải có để cho phép thả dữ liệu
        if (dragBooking) {
            switchToLate();
        }
    });
});

function getDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
adminDate.value = getDateString(tomorrow);

prevDayBtn.addEventListener("click", () => { const d = new Date(adminDate.value); d.setDate(d.getDate() - 1); adminDate.value = getDateString(d); loadReservations(); });
nextDayBtn.addEventListener("click", () => { const d = new Date(adminDate.value); d.setDate(d.getDate() + 1); adminDate.value = getDateString(d); loadReservations(); });
updateBtn.addEventListener("click", () => { const nextDay = new Date(); nextDay.setDate(nextDay.getDate() + 1); adminDate.value = getDateString(nextDay); loadReservations(); });
adminDate.addEventListener("change", () => loadReservations());

btnSeatAri.addEventListener("click", () => { soinetSeatStatus = soinetSeatStatus === "ari" ? "" : "ari"; updateSeatBtns(); });
btnSeatNashi.addEventListener("click", () => { soinetSeatStatus = soinetSeatStatus === "nashi" ? "" : "nashi"; updateSeatBtns(); });

function updateSeatBtns() {
    btnSeatAri.className = "seat-btn-compact" + (soinetSeatStatus === "ari" ? " selected-ari" : "");
    btnSeatNashi.className = "seat-btn-compact" + (soinetSeatStatus === "nashi" ? " selected-nashi" : "");
}

stayToggle.addEventListener("click", () => {
    stayActive = !stayActive; stayToggle.textContent = stayActive ? "ON" : "OFF"; stayToggle.classList.toggle("active", stayActive);
});

function initReserveButtons() {
    document.querySelectorAll(".reserve-btn").forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll(".reserve-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            popup.dataset.time = btn.dataset.time;
            popup.dataset.car = btn.dataset.car;
            popup.dataset.editId = "";
            popup.dataset.editDate = "";
            popup.classList.remove("hidden");
            resetForm();
        });
    });
}

function resetForm() {
    reserveForm.reset(); soinetSeatStatus = ""; updateSeatBtns(); stayActive = false;
    stayToggle.textContent = "OFF"; stayToggle.classList.remove("active");
    document.querySelectorAll('.stepper-input input').forEach(input => input.value = 0);
}

closePopup.addEventListener("click", () => { popup.classList.add("hidden"); });

reserveForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1. Kiểm tra bắt buộc nhập Số phòng (Không được để trống)
    const roomValue = inputRoom.value.trim();
    if (!roomValue) {
        alert("部屋番号を入力してください (Vui lòng nhập số phòng)");
        inputRoom.focus();
        return;
    }

    // 2. Kiểm tra bắt buộc nhập Số hành khách (Người lớn phải lớn hơn 0)
    const adults = Number(selAdults.value) || 0;
    if (adults <= 0) {
        alert("大人 の人数を入力してください (Vui lòng nhập số lượng người lớn)");
        selAdults.focus();
        return;
    }

    // Nếu thỏa mãn cả 2 điều kiện trên thì tiến hành lưu dữ liệu lên Firebase
    const data = {
        bookingSource: "staff",
        date: adminDate.value,
        time: popup.dataset.time,
        car: popup.dataset.car,
        stay: stayActive,
        room: roomValue, // Sử dụng giá trị đã trim khoảng trắng
        name: inputName.value,
        note: inputNote.value,
        adults: adults,
        soinet: Number(selSoinet.value) || 0,
        soinetSeat: soinetSeatStatus,
        tokudai: Number(lugTokudai.value) || 0,
        large: Number(lugLarge.value) || 0,
        medium: Number(lugMedium.value) || 0,
        small: Number(lugSmall.value) || 0,
        stroller: 0,
        golf: 0,
        createdAt: Date.now()
    };

    const editId = popup.dataset.editId;
    if (editId) {
        db.ref("reservations/" + popup.dataset.editDate + "/" + editId).set(data);
    } else {
        db.ref("reservations/" + data.date).push(data)
            .then(() => {
                alert("保存しました");
            })
            .catch((error) => {
                console.error(error);
                alert("保存失敗");
            });
    }

    popup.classList.add("hidden");
    resetForm();
    popup.dataset.editId = "";
});

// ── CUSTOM PASSWORD POPUP HANDLING ──
function openPasswordCheck(actionType, extraData = null) {
    pendingActionType = actionType; pendingItemData = extraData;
    pwdInput.value = ""; passwordPopup.classList.remove("hidden"); pwdInput.focus();
}

pwdCancelBtn.addEventListener("click", () => { passwordPopup.classList.add("hidden"); dragBooking = null; pendingItemData = null; });
pwdConfirmBtn.addEventListener("click", executeSecureAction);
pwdInput.addEventListener("keypress", (e) => { if (e.key === "Enter") executeSecureAction(); });

async function executeSecureAction() {

    if (pwdInput.value !== "0000") {
        alert("パスワードが違います。");
        return;
    }

    passwordPopup.classList.add("hidden");

    // =========================
    // DELETE FORM
    // =========================

    if (pendingActionType === "delete_form") {

        const today = new Date();

        const y = today.getFullYear();

        const m = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const d = String(
            today.getDate()
        ).padStart(2, "0");

        const todayStr = `${y}-${m}-${d}`;

        const ref = db.ref(
            "reservations/" +
            popup.dataset.editDate +
            "/" +
            popup.dataset.editId
        );

        // ngày tương lai -> xóa luôn
        if (popup.dataset.editDate > todayStr) {

            await ref.remove();

        }

        // hôm nay / quá khứ
        else {

            await ref.update({
                status: "canceled"
            });

        }

        popup.classList.add("hidden");

        resetForm();

        popup.dataset.editId = "";

    }

    // =========================
    // QUICK DELETE
    // =========================

    else if (pendingActionType === "delete_quick") {

        if (!pendingItemData) return;

        const today = new Date();

        const y = today.getFullYear();

        const m = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const d = String(
            today.getDate()
        ).padStart(2, "0");

        const todayStr = `${y}-${m}-${d}`;

        const ref = db.ref(
            "reservations/" +
            pendingItemData.date +
            "/" +
            pendingItemData.id
        );

        // ngày tương lai -> xóa luôn
        if (pendingItemData.date > todayStr) {

            await ref.remove();

        }

        // hôm nay / quá khứ
        else {

            await ref.update({
                status: "canceled"
            });

        }

    }

    // =========================
    // MOVE BOOKING
    // =========================

    else if (pendingActionType === "move") {

        if (!dragBooking) return;

        const today = new Date();

        const y = today.getFullYear();

        const m = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const d = String(
            today.getDate()
        ).padStart(2, "0");

        const todayStr = `${y}-${m}-${d}`;

        const oldRef = db.ref(
            "reservations/" +
            dragBooking.date +
            "/" +
            dragBooking.id
        );

        // =========================
        // BOOKING CŨ
        // =========================

        // ngày tương lai -> xóa luôn
        await oldRef.update({
            status: "moved",
            movedTo: pendingTargetTime
        });

        // =========================
        // BOOKING MỚI
        // =========================

        const newData = {

            ...dragBooking,

            time: pendingTargetTime,

            car: pendingTargetCar,

            movedFrom: dragBooking.time,

            createdAt: Date.now()

        };

        delete newData.id;
        delete newData.status;
        delete newData.movedTo;

        await db.ref(
            "reservations/" +
            dragBooking.date
        ).push(newData);

        // =========================
        // AUTO SWITCH TAB
        // =========================

        const earlyHours = [
            "06:05",
            "06:20",
            "06:40",
            "07:00"
        ];

        const lateHours = [
            "07:30",
            "08:00",
            "08:30",
            "09:00",
            "09:30",
            "10:00"
        ];

        if (
            lateHours.includes(
                pendingTargetTime
            )
        ) {

            btnPageLate.click();

        }
        else if (
            earlyHours.includes(
                pendingTargetTime
            )
        ) {

            btnPageEarly.click();

        }

        dragBooking = null;

    }

    pendingItemData = null;

}
function applySearchFilter() {

    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();

    document.querySelectorAll(".guest-line")
        .forEach(line => {

            const room =
                (line.dataset.room || "")
                    .toLowerCase();

            const name =
                (line.dataset.name || "")
                    .toLowerCase();

            const matched =
                room.includes(keyword) ||
                name.includes(keyword);

            line.style.display =
                matched ? "" : "none";

        });

}
deleteBtn.addEventListener("click", () => { if (!popup.dataset.editId) return; openPasswordCheck("delete_form"); });

// ── LOAD RESERVATIONS ──
function loadReservations() {

    const selectedDate = adminDate.value;

    if (currentReservationRef) {
        currentReservationRef.off();
    }

    currentReservationRef =
        db.ref("reservations/" + selectedDate);

    currentReservationRef.on("value", (snapshot) => {

        const data = snapshot.val();

        // =========================
        // RESET UI
        // =========================

        document.querySelectorAll(".guest-row")
            .forEach(row => row.innerHTML = "");

        document.querySelectorAll(".empty-text")
            .forEach(el => {

                el.classList.remove(
                    "few-seat",
                    "full-seat"
                );

                el.innerHTML =
                    "予約済 <span class='seat-count-num'>0</span>名";

            });

        // =========================
        // SEAT COUNT
        // =========================

        const usedMap = {};

        if (data) {

            Object.entries(data).forEach(([id, item]) => {

                // canceled + moved cũ KHÔNG tính ghế
                if (
                    item.status === "canceled" ||
                    item.status === "moved"
                ) {
                    return;
                }

                const key =
                    item.time + "_" + item.car;

                if (!usedMap[key]) {
                    usedMap[key] = 0;
                }

                let totalSeats =
                    Number(item.adults || 0);

                if (item.soinetSeat === "ari") {

                    totalSeats +=
                        Number(item.soinet || 0);

                }

                usedMap[key] += totalSeats;

            });

        }

        // =========================
        // UPDATE SEAT LABEL
        // =========================

        Object.keys(seatMap).forEach(key => {

            const [time, car] =
                key.split(/_(.+)/);

            const btn = document.querySelector(
                `.reserve-btn[data-time="${time}"][data-car="${car}"]`
            );

            if (!btn) return;

            const td =
                btn.closest(".car-cell-box");

            if (!td) return;

            const emptyText =
                td.querySelector(".empty-text");

            if (!emptyText) return;

            const max = seatMap[key];

            const used = usedMap[key] || 0;

            const remain = max - used;

            if (remain <= 0) {

                emptyText.innerHTML =
                    `予約済 <span class='seat-count-num'>${used}</span>名 <span class='seat-full-label'>満車</span>`;

                emptyText.classList.add(
                    "full-seat"
                );

            }
            else if (remain === 1) {

                emptyText.innerHTML =
                    `予約済 <span class='seat-count-num'>${used}</span>名`;

                emptyText.classList.add(
                    "few-seat"
                );

            }
            else {

                emptyText.innerHTML =
                    `予約済 <span class='seat-count-num'>${used}</span>名`;

            }

        });

        initReserveButtons();

        if (!data) return;

        // =========================
        // RENDER BOOKINGS
        // =========================

        Object.entries(data).forEach(([id, item]) => {

            item.id = id;
            item.date = selectedDate;

            const btn = document.querySelector(
                `.reserve-btn[data-time="${item.time}"][data-car="${item.car}"]`
            );

            if (!btn) return;

            const td =
                btn.closest(".car-cell-box");

            if (!td) return;

            let guestRow =
                td.querySelector(".guest-row");

            if (!guestRow) {

                guestRow =
                    document.createElement("div");

                guestRow.className = "guest-row";

                td.prepend(guestRow);

            }

            // =========================
            // STATUS
            // =========================

            const isCanceled =
                item.status === "canceled";

            const isMoved =
                item.status === "moved";

            const isDone =
                item.status === "done";

            // =========================
            // CREATE LINE
            // =========================

            const line =
                document.createElement("div");

            line.className = "guest-line";

            line.dataset.room = item.room || "";
            line.dataset.name = item.name || "";

            if (isDone) {
                line.classList.add("is-done");
            }

            if (isMoved) {
                line.classList.add("is-moved");
            }

            if (isCanceled) {
                line.classList.add("is-canceled");
            }

            // =========================
            // PAX
            // =========================

            const adultsCount =
                Number(item.adults || 0);

            const soinetCount =
                Number(item.soinet || 0);

            let paxDisplay = `
                <span class="flat-pax">
                    ${adultsCount}名
                </span>
            `;

            if (soinetCount > 0) {

                const seatLabel =
                    item.soinetSeat === "ari"
                        ? "席あり"
                        : "席なし";

                paxDisplay += `
                    <span class="flat-inf-label">
                        + ${soinetCount}INF
                    </span>

                    <span class="flat-inf-bracket">
                        (${seatLabel})
                    </span>
                `;

            }

            // =========================
            // LUGGAGE
            // =========================

            let luggageText = "";

            if (Number(item.tokudai || 0) > 0) {
                luggageText += ` (特大${item.tokudai})`;
            }

            if (Number(item.large || 0) > 0) {
                luggageText += ` (大${item.large})`;
            }

            if (Number(item.medium || 0) > 0) {
                luggageText += ` (中${item.medium})`;
            }

            if (Number(item.small || 0) > 0) {
                luggageText += ` (小${item.small})`;
            }

            if (
                item.note &&
                item.note.trim() !== ""
            ) {

                luggageText +=
                    ` (${item.note.trim()})`;

            }

            // =========================
            // STAY
            // =========================

            const stayText = item.stay
                ? `<span class="stay-label">[ステイ]</span>`
                : "";

            // =========================
            // MAIN CONTENT
            // =========================

            const mainContentBlock =
                document.createElement("div");

            mainContentBlock.className =
                "guest-main-content-block";

            mainContentBlock.innerHTML = `
                <span class="flat-room">
                    R${item.room || "-"}
                </span>

                ${paxDisplay}

                <span class="guest-name-text">
                    ${item.name || ""}
                </span>様

                ${stayText}

                <span class="lug-text-summary">
                    ${luggageText}
                </span>
            `;

            // =========================
            // RIGHT SIDE
            // =========================

            const rightActionsBlock =
                document.createElement("div");

            rightActionsBlock.className =
                "guest-right-actions-block";

            // moved old booking
            if (isMoved && item.movedTo) {

                rightActionsBlock.innerHTML += `
                    <span class="dest-label">
                        → ${item.movedTo}
                    </span>
                `;

            }

            // moved new booking
            if (item.movedFrom) {

                rightActionsBlock.innerHTML += `
                    <span class="from-label">
                        ← ${item.movedFrom}
                    </span>
                `;

            }

            // canceled delete button
            if (isCanceled) {

                const quickDelBtn =
                    document.createElement("button");

                quickDelBtn.className =
                    "quick-del-btn";

                quickDelBtn.innerHTML = "&times;";

                quickDelBtn.type = "button";

                quickDelBtn.addEventListener(
                    "click",
                    (e) => {

                        e.stopPropagation();

                        openPasswordCheck(
                            "delete_quick",
                            item
                        );

                    }
                );

                rightActionsBlock.appendChild(
                    quickDelBtn
                );

            }

            // =========================
            // DRAG
            // =========================

            if (!isCanceled && !isMoved) {

                line.draggable = true;

                line.addEventListener(
                    "dragstart",
                    () => {

                        dragBooking = item;

                    }
                );

            }

            // =========================
            // CLICK EDIT
            // =========================



            // =========================
            // DOUBLE CLICK
            // =========================

            let clickTimer = null;

            line.addEventListener("click", (e) => {

                // bỏ qua nút delete
                if (
                    e.target.classList.contains(
                        "quick-del-btn"
                    )
                ) return;

                // DOUBLE CLICK
                if (e.detail >= 2) {

                    clearTimeout(clickTimer);

                    if (isMoved) return;

                    const ref = db.ref(
                        "reservations/" +
                        item.date +
                        "/" +
                        item.id
                    );

                    (async () => {

                        try {

                            // done -> normal
                            if (isDone) {

                                await ref.child("status").remove();

                            }

                            // canceled -> normal
                            else if (isCanceled) {

                                await ref.child("status").remove();

                            }

                            // normal -> done
                            else {

                                await ref.update({
                                    status: "done"
                                });

                            }

                        }
                        catch (error) {

                            console.error(error);

                            alert("更新失敗");

                        }

                    })();

                    return;
                }

                // SINGLE CLICK → mở form edit
                clickTimer = setTimeout(() => {

                    popup.classList.remove("hidden");

                    popup.dataset.editId = item.id;

                    popup.dataset.editDate = item.date;

                    popup.dataset.time = item.time;

                    popup.dataset.car = item.car;

                    inputRoom.value = item.room || "";

                    inputName.value = item.name || "";

                    inputNote.value = item.note || "";

                    selAdults.value = item.adults || 0;

                    selSoinet.value = item.soinet || 0;

                    soinetSeatStatus =
                        item.soinetSeat || "";

                    updateSeatBtns();

                    stayActive =
                        item.stay || false;

                    stayToggle.textContent =
                        stayActive ? "ON" : "OFF";

                    stayToggle.classList.toggle(
                        "active",
                        stayActive
                    );

                    lugTokudai.value =
                        item.tokudai || 0;

                    lugLarge.value =
                        item.large || 0;

                    lugMedium.value =
                        item.medium || 0;

                    lugSmall.value =
                        item.small || 0;

                }, 200);

            });

            // =========================
            // APPEND
            // =========================

            line.appendChild(mainContentBlock);

            line.appendChild(rightActionsBlock);

            guestRow.appendChild(line);
            applySearchFilter();

        });

    });

}

// ── DRAG & DROP LIÊN TRANG ──
document.querySelectorAll(".car-cell-box").forEach(td => {
    td.addEventListener("dragover", (e) => { e.preventDefault(); td.classList.add("drag-over"); });
    td.addEventListener("dragleave", () => td.classList.remove("drag-over"));
    td.addEventListener("drop", () => {
        td.classList.remove("drag-over"); if (!dragBooking) return;

        // Lấy thông tin khung giờ và loại xe của ô vừa thả chuột
        pendingTargetTime = td.dataset.time;
        pendingTargetCar = td.dataset.car;

        if (dragBooking.time === pendingTargetTime && dragBooking.car === pendingTargetCar) { dragBooking = null; return; }
        const ok = confirm(
            `${dragBooking.room}を${pendingTargetTime}へ移動しますか？`
        );

        if (!ok) {
            dragBooking = null;
            return;
        }

        openPasswordCheck("move");
    });
});

document.querySelectorAll('.stepper-input').forEach(stepper => {
    const minusBtn = stepper.querySelector('.minus'); const plusBtn = stepper.querySelector('.plus'); const input = stepper.querySelector('input[type="number"]');
    minusBtn.addEventListener('click', () => { let val = parseInt(input.value) || 0; let min = parseInt(input.min) || 0; if (val > min) input.value = val - 1; });
    plusBtn.addEventListener('click', () => { let val = parseInt(input.value) || 0; let max = parseInt(input.max) || 99; if (val < max) input.value = val + 1; });
});
function isTodayBooking(dateStr) {
    const today = new Date();

    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    return dateStr === `${y}-${m}-${d}`;
}
searchInput.addEventListener("input", () => {
    applySearchFilter();
});
const searchBtn =
    document.getElementById("searchBtn");

const clearSearchBtn =
    document.getElementById("clearSearchBtn");
const searchResults =
    document.getElementById("searchResults");
clearSearchBtn.addEventListener(
    "click",
    () => {

        searchInput.value = "";

        searchResults.innerHTML = "";

        searchInput.blur();

    }
);




searchBtn.addEventListener(
    "click",
    async () => {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();

        if (!keyword) return;

        searchResults.innerHTML = "";

        const snapshot =
            await db.ref("reservations").once("value");

        const allData =
            snapshot.val();

        if (!allData) return;

        Object.entries(allData).forEach(
            ([date, bookings]) => {

                Object.entries(bookings).forEach(
                    ([id, item]) => {

                        const room =
                            String(item.room || "")
                                .toLowerCase();

                        const name =
                            String(item.name || "")
                                .toLowerCase();

                        if (
                            !room.includes(keyword) &&
                            !name.includes(keyword)
                        ) {
                            return;
                        }

                        // hành lý
                        let luggage = "";

                        if (item.tokudai > 0) {
                            luggage += `特大${item.tokudai} `;
                        }

                        if (item.large > 0) {
                            luggage += `大${item.large} `;
                        }

                        if (item.medium > 0) {
                            luggage += `中${item.medium} `;
                        }

                        if (item.small > 0) {
                            luggage += `小${item.small} `;
                        }

                        const div =
                            document.createElement("div");

                        div.className =
                            "search-result-item";

                        div.innerHTML = `

                            <div class="search-result-top">
                                ${date}
                                ${item.time}
                                (${item.car})
                            </div>

                            <div class="search-result-sub">

                                部屋:
                                ${item.room || "-"}

                                ／ 名前:
                                ${item.name || "-"}

                                ／ 人数:
                                ${item.adults || 0}名

                                <br>

                                荷物:
                                ${luggage || "なし"}

                            </div>

                        `;

                        // click để mở form edit
                        div.addEventListener(
                            "click",
                            () => {

                                popup.classList.remove(
                                    "hidden"
                                );

                                popup.dataset.editId =
                                    id;

                                popup.dataset.editDate =
                                    date;

                                popup.dataset.time =
                                    item.time;

                                popup.dataset.car =
                                    item.car;

                                inputRoom.value =
                                    item.room || "";

                                inputName.value =
                                    item.name || "";

                                inputNote.value =
                                    item.note || "";

                                selAdults.value =
                                    item.adults || 0;

                                selSoinet.value =
                                    item.soinet || 0;

                                soinetSeatStatus =
                                    item.soinetSeat || "";

                                updateSeatBtns();

                                stayActive =
                                    item.stay || false;

                                stayToggle.textContent =
                                    stayActive
                                        ? "ON"
                                        : "OFF";

                                stayToggle.classList.toggle(
                                    "active",
                                    stayActive
                                );

                                lugTokudai.value =
                                    item.tokudai || 0;

                                lugLarge.value =
                                    item.large || 0;

                                lugMedium.value =
                                    item.medium || 0;

                                lugSmall.value =
                                    item.small || 0;

                            }
                        );

                        searchResults.appendChild(div);

                    }
                );

            }
        );

    }
);
// ========================================
// EXPORT EXCEL
// ========================================

const exportExcelBtn =
    document.getElementById("exportExcelBtn");

exportExcelBtn.addEventListener(
    "click",
    exportExcel
);

async function exportExcel() {

    try {

        const date =
            adminDate.value;

        const response =
            await fetch("./bus_booking.xlsx");

        const arrayBuffer =
            await response.arrayBuffer();

        const workbook =
            new ExcelJS.Workbook();

        await workbook.xlsx.load(arrayBuffer);

        const sheet =
            workbook.worksheets[0];

        // DATE

        const weekList = [
            "日",
            "月",
            "火",
            "水",
            "木",
            "金",
            "土"
        ];

        const dateObj =
            new Date(date);

        const week =
            weekList[dateObj.getDay()];

        const [year, month, day] =
            date.split("-");

        sheet.getCell("I1").value =
            `${Number(month)}月 ${Number(day)}日（${week}）`;

        sheet.getCell("D1").value =
            `${Number(month)}月 ${Number(day)}日（${week}）`;

        // FIREBASE

        const snapshot =
            await db.ref(
                "reservations/" + date
            ).get();

        const data =
            snapshot.val();

        if (!data) {

            alert("データなし");

            return;

        }

        // CELL MAP

        const cellMap = {

            "06:05_ラッキータクシー": "C5",
            "06:05_ホテル": "D5",

            "06:20_ラッキータクシー": "C15",
            "06:20_ホテル": "D15",

            "06:40_ラッキータクシー": "C25",
            "06:40_ホテル": "D25",

            "07:00_ラッキータクシー": "C35",
            "07:00_ホテル": "D35",

            "07:30_ホテル": "G3",
            "08:00_ホテル": "G15",
            "08:30_ホテル": "G25",

            "09:00_ホテル": "I3",
            "09:30_ホテル": "I15",
            "10:00_ホテル": "I25"

        };

        // CLEAR

        Object.values(cellMap)
            .forEach(cell => {

                sheet.getCell(cell).value = "";

            });

        // WRITE

        Object.values(data)
            .forEach(item => {

                if (
                    item.status === "canceled"
                    ||
                    item.status === "moved"
                ) {
                    return;
                }

                const key =
                    item.time + "_" + item.car;

                const cell =
                    cellMap[key];

                if (!cell) {
                    return;
                }

                const target =
                    sheet.getCell(cell);

                target.numFmt = "@";

                const oldText =
                    target.value
                        ? String(target.value)
                        : "";

                // luggage

                let luggageText = "";

                if (item.tokudai > 0) {

                    luggageText += ` 特大${item.tokudai}`;

                }

                if (item.large > 0) {

                    luggageText += ` 大${item.large}`;

                }

                if (item.medium > 0) {

                    luggageText += ` 中${item.medium}`;

                }

                if (item.small > 0) {

                    luggageText += ` 小${item.small}`;

                }

                // stay

                let stayText = "";

                if (item.stay) {

                    stayText = " ステイ";

                }

                const text =
                    `${item.room || ""}｜${item.name || ""}｜${item.adults || 0}名${luggageText}${stayText}`;

                target.value =
                    oldText
                        ? oldText + "\n" + text
                        : text;

                target.alignment = {

                    wrapText: true,
                    vertical: "top",
                    horizontal: "left"

                };

                const lineCount =
                    String(target.value)
                        .split("\n")
                        .length;

                sheet.getRow(target.row).height =
                    Math.max(20, lineCount * 18);

            });

        // EXPORT

        const buffer =
            await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer]),
            `bus_${date}.xlsx`
        );

    }

    catch (error) {

        console.error(error);

        alert("Excel出力エラー");

    }

}
// const roomSortResult =
// document.getElementById("roomSortResult");


async () => {

    const date =
        adminDate.value;

    roomSortResult.innerHTML = "";

    const snapshot =
        await db.ref(
            "reservations/" + date
        ).get();

    const data =
        snapshot.val();

    if (!data) {

        roomSortResult.innerHTML =
            "データなし";

        return;

    }

    // array
    const list = [];

    Object.entries(data)
        .forEach(([id, item]) => {

            // bỏ canceled
            if (
                item.status === "canceled"
                ||
                item.status === "moved"
            ) {
                return;
            }

            list.push(item);

        });

    // sort theo số phòng
    list.sort((a, b) => {

        const roomA =
            parseInt(a.room) || 0;

        const roomB =
            parseInt(b.room) || 0;

        return roomA - roomB;

    });

    // render
    list.forEach(item => {

        const div =
            document.createElement("div");

        div.className =
            "room-sort-line";

        let luggage = "";

        if (item.tokudai > 0) {

            luggage += ` 特大${item.tokudai}`;

        }

        if (item.large > 0) {

            luggage += ` 大${item.large}`;

        }

        if (item.medium > 0) {

            luggage += ` 中${item.medium}`;

        }

        if (item.small > 0) {

            luggage += ` 小${item.small}`;

        }

        div.innerHTML = `

                ${item.room || "-"}

                ｜

                ${item.name || "-"}

                ｜

                ${item.time || "-"}

                ｜

                ${item.adults || 0}名

                ${luggage}

            `;

        roomSortResult.appendChild(div);

    });

}

showAllBookingsBtn.addEventListener(
    "click",
    async () => {

        const date = adminDate.value;

        const snapshot =
            await db.ref(
                "reservations/" + date
            ).get();

        const data = snapshot.val();

        allBookingsList.innerHTML = "";

        if (!data) {

            allBookingsList.innerHTML =
                "<div>データなし</div>";

            allBookingsPopup.classList.remove(
                "hidden"
            );

            return;

        }

        // ARRAY
        const arr = Object.entries(data)
            .map(([id, item]) => ({

                id,
                ...item

            }));

        // FILTER
        const filtered =
            arr.filter(item =>

                !item.cancelledAt
                && item.status !== "moved"

            );

        // SORT ROOM
        filtered.sort((a, b) => {

            const roomA =
                parseInt(a.room) || 0;

            const roomB =
                parseInt(b.room) || 0;

            return roomA - roomB;

        });

        // RENDER
        filtered.forEach(item => {

            const div =
                document.createElement("div");

            div.className =
                "booking-list-line";

            let luggage = "";

            if (item.tokudai > 0) {

                luggage += ` 特大${item.tokudai}`;

            }

            if (item.large > 0) {

                luggage += ` 大${item.large}`;

            }

            if (item.medium > 0) {

                luggage += ` 中${item.medium}`;

            }

            if (item.small > 0) {

                luggage += ` 小${item.small}`;

            }

            div.innerHTML = `

        <div class="booking-room">
          R${item.room || "-"}
        </div>

        <div class="booking-time">
          ${item.time}
        </div>

        <div class="booking-name">
          ${item.name || ""}
          ${luggage}
        </div>

        <div class="booking-pax">
          ${item.adults || 0}名
        </div>

      `;

            allBookingsList.appendChild(div);

        });

        allBookingsPopup.classList.remove(
            "hidden"
        );

    }
);

// =====================================
// ALL BOOKINGS POPUP
// =====================================





// ĐÓNG POPUP
closeAllBookingsBtn.addEventListener("click", () => {

    allBookingsPopup.classList.add("hidden");

});


// CLICK NGOÀI ĐỂ ĐÓNG
allBookingsPopup.addEventListener("click", (e) => {

    if (e.target === allBookingsPopup) {

        allBookingsPopup.classList.add("hidden");

    }

});


// =====================================
// RENDER ALL BOOKINGS
// =====================================

loadReservations();