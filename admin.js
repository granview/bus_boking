// ── FIREBASE CONFIG ──
let dragBooking = null;

let pendingTargetTime = null;
let pendingTargetCar = null;
let pendingActionType = null; // 'delete_form', 'delete_quick', 'move'
let pendingItemData = null;

// Biến hỗ trợ Drag bằng Touch trên iPad
let activeTouchElement = null; 
let touchClone = null;

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
const showAllBookingsBtn = document.getElementById("showAllBookingsBtn");
const allBookingsPopup = document.getElementById("allBookingsPopup");
const allBookingsList = document.getElementById("allBookingsList");
const closeAllBookingsBtn = document.getElementById("closeAllBookingsBtn");

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

// Hàm xử lý chuyển đổi Tab Ca làm việc công khai
const switchToEarly = () => {
    if(!btnPageEarly) return;
    btnPageEarly.classList.add("active");
    btnPageLate.classList.remove("active");
    pageEarlyView.classList.remove("hidden");
    pageLateView.classList.add("hidden");
};

const switchToLate = () => {
    if(!btnPageLate) return;
    btnPageLate.classList.add("active");
    btnPageEarly.classList.remove("active");
    pageLateView.classList.remove("hidden");
    pageEarlyView.classList.add("hidden");
};

// ── TRANG TOGGLE ──
document.addEventListener("DOMContentLoaded", () => {
    // Xử lý sự kiện click chuột bình thường
    if(btnPageEarly) btnPageEarly.addEventListener("click", switchToEarly);
    if(btnPageLate) btnPageLate.addEventListener("click", switchToLate);

    // TỰ ĐỘNG CHUYỂN TRANG KHI KÉO THẢ TRÊN PC
    btnPageEarly.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragBooking) switchToEarly();
    });

    btnPageLate.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (dragBooking) switchToLate();
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
    const roomValue = inputRoom.value.trim();
    if (!roomValue) {
        alert("部屋番号を入力してください (Vui lòng nhập số phòng)");
        inputRoom.focus();
        return;
    }

    const adults = Number(selAdults.value) || 0;
    if (adults <= 0) {
        alert("大人 の人数を入力してください (Vui lòng nhập số lượng người lớn)");
        selAdults.focus();
        return;
    }

    const data = {
        bookingSource: "staff",
        date: adminDate.value,
        time: popup.dataset.time,
        car: popup.dataset.car,
        stay: stayActive,
        room: roomValue,
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
            .then(() => { alert("保存しました"); })
            .catch((error) => { console.error(error); alert("保存失敗"); });
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

    if (pendingActionType === "delete_form") {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const ref = db.ref("reservations/" + popup.dataset.editDate + "/" + popup.dataset.editId);

        if (popup.dataset.editDate > todayStr) { await ref.remove(); }
        else { await ref.update({ status: "canceled" }); }

        popup.classList.add("hidden");
        resetForm();
        popup.dataset.editId = "";
    }
    else if (pendingActionType === "delete_quick") {
        if (!pendingItemData) return;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const ref = db.ref("reservations/" + pendingItemData.date + "/" + pendingItemData.id);

        if (pendingItemData.date > todayStr) { await ref.remove(); }
        else { await ref.update({ status: "canceled" }); }
    }
    else if (pendingActionType === "move") {
        if (!dragBooking) return;
        const oldRef = db.ref("reservations/" + dragBooking.date + "/" + dragBooking.id);

        await oldRef.update({
            status: "moved",
            movedTo: pendingTargetTime
        });

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

        await db.ref("reservations/" + dragBooking.date).push(newData);

        const earlyHours = ["06:05", "06:20", "06:40", "07:00"];
        const lateHours = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];

        if (lateHours.includes(pendingTargetTime)) { btnPageLate.click(); }
        else if (earlyHours.includes(pendingTargetTime)) { btnPageEarly.click(); }

        dragBooking = null;
    }
    pendingItemData = null;
}

function applySearchFilter() {
    const keyword = searchInput.value.trim().toLowerCase();
    document.querySelectorAll(".guest-line").forEach(line => {
        const room = (line.dataset.room || "").toLowerCase();
        const name = (line.dataset.name || "").toLowerCase();
        const matched = room.includes(keyword) || name.includes(keyword);
        line.style.display = matched ? "" : "none";
    });
}
deleteBtn.addEventListener("click", () => { if (!popup.dataset.editId) return; openPasswordCheck("delete_form"); });

// ── LOAD RESERVATIONS ──
function loadReservations() {
    const selectedDate = adminDate.value;
    if (currentReservationRef) { currentReservationRef.off(); }

    currentReservationRef = db.ref("reservations/" + selectedDate);
    currentReservationRef.on("value", (snapshot) => {
        const data = snapshot.val();

        document.querySelectorAll(".guest-row").forEach(row => row.innerHTML = "");
        document.querySelectorAll(".empty-text").forEach(el => {
            el.classList.remove("few-seat", "full-seat");
            el.innerHTML = "予約済 <span class='seat-count-num'>0</span>名";
        });

        const usedMap = {};
        if (data) {
            Object.entries(data).forEach(([id, item]) => {
                if (item.status === "canceled" || item.status === "moved") return;
                const key = item.time + "_" + item.car;
                if (!usedMap[key]) { usedMap[key] = 0; }

                let totalSeats = Number(item.adults || 0);
                if (item.soinetSeat === "ari") { totalSeats += Number(item.soinet || 0); }
                usedMap[key] += totalSeats;
            });
        }

        Object.keys(seatMap).forEach(key => {
            const [time, car] = key.split(/_(.+)/);
            const btn = document.querySelector(`.reserve-btn[data-time="${time}"][data-car="${car}"]`);
            if (!btn) return;
            const td = btn.closest(".car-cell-box");
            if (!td) return;
            const emptyText = td.querySelector(".empty-text");
            if (!emptyText) return;

            const max = seatMap[key];
            const used = usedMap[key] || 0;
            const remain = max - used;

            if (remain <= 0) {
                emptyText.innerHTML = `予約済 <span class='seat-count-num'>${used}</span>名 <span class='seat-full-label'>満車</span>`;
                emptyText.classList.add("full-seat");
            } else if (remain === 1) {
                emptyText.innerHTML = `予約済 <span class='seat-count-num'>${used}</span>名`;
                emptyText.classList.add("few-seat");
            } else {
                emptyText.innerHTML = `予約済 <span class='seat-count-num'>${used}</span>名`;
            }
        });

        initReserveButtons();
        if (!data) return;

        // RENDER BOOKINGS
        Object.entries(data).forEach(([id, item]) => {
            item.id = id;
            item.date = selectedDate;

            const btn = document.querySelector(`.reserve-btn[data-time="${item.time}"][data-car="${item.car}"]`);
            if (!btn) return;
            const td = btn.closest(".car-cell-box");
            if (!td) return;

            let guestRow = td.querySelector(".guest-row");
            if (!guestRow) {
                guestRow = document.createElement("div");
                guestRow.className = "guest-row";
                td.prepend(guestRow);
            }

            const isCanceled = item.status === "canceled";
            const isMoved = item.status === "moved";
            const isDone = item.status === "done";

            const line = document.createElement("div");
            line.className = "guest-line";
            line.dataset.room = item.room || "";
            line.dataset.name = item.name || "";

            if (isDone) line.classList.add("is-done");
            if (isMoved) line.classList.add("is-moved");
            if (isCanceled) line.classList.add("is-canceled");

            const adultsCount = Number(item.adults || 0);
            const soinetCount = Number(item.soinet || 0);
            let paxDisplay = `<span class="flat-pax">${adultsCount}名</span>`;

            if (soinetCount > 0) {
                const seatLabel = item.soinetSeat === "ari" ? "席あり" : "席なし";
                paxDisplay += `
                    <span class="flat-inf-label">+ ${soinetCount}INF</span>
                    <span class="flat-inf-bracket">(${seatLabel})</span>
                `;
            }

            let luggageText = "";
            if (Number(item.tokudai || 0) > 0) luggageText += ` (特大${item.tokudai})`;
            if (Number(item.large || 0) > 0) luggageText += ` (大${item.large})`;
            if (Number(item.medium || 0) > 0) luggageText += ` (中${item.medium})`;
            if (Number(item.small || 0) > 0) luggageText += ` (小${item.small})`;
            if (item.note && item.note.trim() !== "") luggageText += ` (${item.note.trim()})`;

            const stayText = item.stay ? `<span class="stay-label">[ステイ]</span>` : "";

            const mainContentBlock = document.createElement("div");
            mainContentBlock.className = "guest-main-content-block";
            mainContentBlock.innerHTML = `
                <span class="flat-room">R${item.room || "-"}</span>
                ${paxDisplay}
                <span class="guest-name-text">${item.name || ""}</span>様
                ${stayText}
                <span class="lug-text-summary">${luggageText}</span>
            `;

            const rightActionsBlock = document.createElement("div");
            rightActionsBlock.className = "guest-right-actions-block";

            if (isMoved && item.movedTo) {
                rightActionsBlock.innerHTML += `<span class="dest-label">→ ${item.movedTo}</span>`;
            }
            if (item.movedFrom) {
                rightActionsBlock.innerHTML += `<span class="from-label">← ${item.movedFrom}</span>`;
            }

            if (isCanceled) {
                const quickDelBtn = document.createElement("button");
                quickDelBtn.className = "quick-del-btn";
                quickDelBtn.innerHTML = "&times;";
                quickDelBtn.type = "button";
                quickDelBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openPasswordCheck("delete_quick", item);
                });
                rightActionsBlock.appendChild(quickDelBtn);
            }

            // ==========================================
            // XỬ LÝ KÉO THẢ (PC & IPAD QUAN TRỌNG NHẤT)
            // ==========================================
            if (!isCanceled && !isMoved) {
                line.draggable = true;

                // Sự kiện Kéo Thả bằng chuột trên PC
                line.addEventListener("dragstart", () => { dragBooking = item; });

                // Sự kiện Cảm ứng Touch trên iPad (Thay thế hoàn hảo cho Drag)
                line.addEventListener("touchstart", (e) => {
                    // Nếu bấm trúng nút Xóa nhanh thì bỏ qua không kéo
                    if (e.target.classList.contains("quick-del-btn")) return;

                    dragBooking = item;
                    activeTouchElement = line;

                    // Tạo một Element nhân bản "bay" theo ngón tay trên iPad để tăng trải nghiệm 
                    touchClone = line.cloneNode(true);
                    touchClone.style.position = "absolute";
                    touchClone.style.width = line.offsetWidth + "px";
                    touchClone.style.opacity = "0.7";
                    touchClone.style.pointerEvents = "none";
                    touchClone.style.zIndex = "9999";
                    touchClone.style.left = e.touches[0].pageX - (line.offsetWidth / 2) + "px";
                    touchClone.style.top = e.touches[0].pageY - (line.offsetHeight / 2) + "px";
                    document.body.appendChild(touchClone);
                }, { passive: true });

                line.addEventListener("touchmove", (e) => {
                    if (!touchClone) return;
                    
                    // Cập nhật vị trí khối nhân bản chạy theo ngón tay
                    const touch = e.touches[0];
                    touchClone.style.left = touch.pageX - (touchClone.offsetWidth / 2) + "px";
                    touchClone.style.top = touch.pageY - (touchClone.offsetHeight / 2) + "px";

                    // Định vị ô .car-cell-box bên dưới ngón tay của iPad
                    const elementOver = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (!elementOver) return;

                    const targetCell = elementOver.closest(".car-cell-box");
                    
                    // Xóa class drag-over của tất cả các ô khác
                    document.querySelectorAll(".car-cell-box").forEach(c => c.classList.remove("drag-over"));
                    
                    if (targetCell) {
                        targetCell.classList.add("drag-over");
                    }

                    // Tự động chuyển Tab Ca làm việc khi kéo ngón tay đè lên nút Ca sớm/Ca muộn trên iPad
                    const overButton = elementOver.closest("#btnPageEarly, #btnPageLate");
                    if (overButton) {
                        if (overButton.id === "btnPageEarly") switchToEarly();
                        if (overButton.id === "btnPageLate") switchToLate();
                    }
                }, { passive: true });

                line.addEventListener("touchend", (e) => {
                    if (touchClone) {
                        touchClone.remove();
                        touchClone = null;
                    }
                    
                    document.querySelectorAll(".car-cell-box").forEach(c => c.classList.remove("drag-over"));

                    if (!dragBooking || activeTouchElement !== line) return;

                    // Lấy tọa độ điểm chạm cuối cùng của ngón tay trước khi nhấc lên
                    const touch = e.changedTouches[0];
                    const elementOver = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    if (elementOver) {
                        const targetCell = elementOver.closest(".car-cell-box");
                        if (targetCell) {
                            pendingTargetTime = targetCell.dataset.time;
                            pendingTargetCar = targetCell.dataset.car;

                            if (dragBooking.time === pendingTargetTime && dragBooking.car === pendingTargetCar) {
                                dragBooking = null;
                                return;
                            }

                            const ok = confirm(`${dragBooking.room} \nを\n${pendingTargetTime} へ移動しますか？`);
                            if (ok) {
                                openPasswordCheck("move");
                            } else {
                                dragBooking = null;
                            }
                        }
                    }
                    activeTouchElement = null;
                });
            }

            // =========================
            // CLICK / LONG PRESS (SỬA LỖI ĐÈ CLICK)
            // =========================
            let clickTimer = null;
            let longPressTimer = null;
            let isMovingTouch = false;

            // Xử lý Double Click/Giữ lâu đổi status Done cho iPad
            line.addEventListener("touchstart", (e) => {
                if (e.target.classList.contains("quick-del-btn")) return;
                isMovingTouch = false;

                if (isMoved) return;

                longPressTimer = setTimeout(async () => {
                    if (isMovingTouch) return; // Nếu ngón tay đang vuốt/kéo đi chỗ khác thì hủy lệnh done

                    const ref = db.ref("reservations/" + item.date + "/" + item.id);
                    try {
                        if (isDone || isCanceled) { await ref.child("status").remove(); } 
                        else { await ref.update({ status: "done" }); }
                    } catch (error) {
                        console.error(error);
                        alert("更新失敗");
                    }
                }, 800); // Nhấn giữ 0.8 giây để Check Done hoặc hủy Done trên iPad
            }, { passive: true });

            line.addEventListener("touchmove", () => {
                isMovingTouch = true;
                clearTimeout(longPressTimer);
            }, { passive: true });

            line.addEventListener("touchend", () => {
                clearTimeout(longPressTimer);
            });

            // SINGLE CLICK bình thường để sửa Form (Áp dụng đồng đều cho cả PC & iPad)
            line.addEventListener("click", (e) => {
                if (e.target.classList.contains("quick-del-btn")) return;
                if (isMovingTouch) return;

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
                soinetSeatStatus = item.soinetSeat || "";

                updateSeatBtns();
                stayActive = item.stay || false;
                stayToggle.textContent = stayActive ? "ON" : "OFF";
                stayToggle.classList.toggle("active", stayActive);

                lugTokudai.value = item.tokudai || 0;
                lugLarge.value = item.large || 0;
                lugMedium.value = item.medium || 0;
                lugSmall.value = item.small || 0;
            });

            line.appendChild(mainContentBlock);
            line.appendChild(rightActionsBlock);
            guestRow.appendChild(line);
            applySearchFilter();
        });
    });
}



document.querySelectorAll('.stepper-input').forEach(stepper => {
    const minusBtn = stepper.querySelector('.minus'); const plusBtn = stepper.querySelector('.plus'); const input = stepper.querySelector('input[type="number"]');
    minusBtn.addEventListener('click', () => { let val = parseInt(input.value) || 0; let min = parseInt(input.min) || 0; if (val > min) input.value = val - 1; });
    plusBtn.addEventListener('click', () => { let val = parseInt(input.value) || 0; let max = parseInt(input.max) || 99; if (val < max) input.value = val + 1; });
});

function isTodayBooking(dateStr) {
    const today = new Date();
    return dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

searchInput.addEventListener("input", () => { applySearchFilter(); });

const searchBtn = document.getElementById("searchBtn");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchResults = document.getElementById("searchResults");

clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchResults.innerHTML = "";
    searchInput.blur();
});

searchBtn.addEventListener("click", async () => {
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) return;

    searchResults.innerHTML = "";
    const snapshot = await db.ref("reservations").once("value");
    const allData = snapshot.val();
    if (!allData) return;

    Object.entries(allData).forEach(([date, bookings]) => {
        Object.entries(bookings).forEach(([id, item]) => {
            const room = String(item.room || "").toLowerCase();
            const name = String(item.name || "").toLowerCase();

            if (!room.includes(keyword) && !name.includes(keyword)) return;

            let luggage = "";
            if (item.tokudai > 0) { luggage += `特大${item.tokudai} `; }
            if (item.large > 0) { luggage += `大${item.large} `; }
            if (item.medium > 0) { luggage += `中${item.medium} `; }
            if (item.small > 0) { luggage += `小${item.small} `; }

            const div = document.createElement("div");
            div.className = "search-result-item";
            div.innerHTML = `
                <div class="search-result-top">${date} ${item.time} (${item.car})</div>
                <div class="search-result-sub">R${item.room} - ${item.name || ''}様</div>
            `;
            searchResults.appendChild(div);
        });
    });
});
