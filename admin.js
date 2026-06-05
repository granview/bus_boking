// ── FIREBASE CONFIG ──
window.addEventListener("touchcancel", () => {

    touchDragBooking = null;
    dragBooking = null;

    if (touchDraggingEl) {
        touchDraggingEl.classList.remove("dragging");
        touchDraggingEl = null;
    }

    clearDragOverCells();

});
let fullCarMap = {};
let originalTime = "";
let dragBooking = null;
let touchDragBooking = null;
let pendingTargetTime = null;
let pendingTargetCar = null;
let touchDraggingEl = null;
let loadReservationsRequestId = 0;



let pendingActionType = null; // 'delete_form', 'delete_quick', 'move'
let pendingItemData = null;
let originalCar = "";


function clearDragOverCells() {
    document.querySelectorAll(".car-cell-box")
        .forEach(td => td.classList.remove("drag-over"));
}

function isInactiveBooking(item) {
    return (
        item.archived ||
        item.status === "canceled" ||
        item.status === "moved"
    );
}

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

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }
    container.appendChild(toast);
    // ensure a layout/repaint before triggering animation
    requestAnimationFrame(() => toast.classList.add("show"));
    const closeToast = () => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    };
    const closeBtn = toast.querySelector(".toast-close");
    if (closeBtn) closeBtn.addEventListener("click", closeToast);
    setTimeout(closeToast, 3000);
}

// Custom confirm modal that returns a Promise<boolean>
function showConfirm(message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
      <div class="confirm-modal">
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="confirm-ok">OK</button>
          <button class="confirm-cancel">キャンセル</button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);
        const clean = (val) => {
            overlay.remove();
            resolve(val);
        };
        overlay.querySelector('.confirm-ok').addEventListener('click', () => clean(true));
        overlay.querySelector('.confirm-cancel').addEventListener('click', () => clean(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) clean(false); });
    });
}

// Custom select modal that returns selected value (or null if cancelled)
function showSelect(message, options = []) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        const buttonsHtml = options.map(opt => `<button class="select-option" data-value="${opt.value}">${opt.label}</button>`).join('');
        overlay.innerHTML = `
            <div class="confirm-modal">
                <p class="confirm-message">${message}</p>
                <div class="select-options">${buttonsHtml}</div>
                <div style="margin-top:12px"><button class="confirm-cancel">キャンセル</button></div>
            </div>
        `;
        document.body.appendChild(overlay);

        const clean = (val) => {
            overlay.remove();
            resolve(val);
        };

        overlay.querySelectorAll('.select-option').forEach(btn => {
            btn.addEventListener('click', () => clean(btn.dataset.value));
        });

        overlay.querySelector('.confirm-cancel').addEventListener('click', () => clean(null));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) clean(null); });
    });
}

// ── ELEMENTS ──

const reserveBtns = document.querySelectorAll(".reserve-btn");
document.querySelectorAll(".reserve-btn")
    .forEach(btn => {

        const fullBtn =
            document.createElement("a");

        fullBtn.className = "full-btn";
        fullBtn.href = "#";

        fullBtn.dataset.time =
            btn.dataset.time;

        fullBtn.dataset.car =
            btn.dataset.car;

        fullBtn.textContent = "満車";

        btn.insertAdjacentElement(
            "afterend",
            fullBtn
        );

    });
document.addEventListener("click", async (e) => {

    const btn = e.target.closest(".full-btn");

    if (!btn) return;

    const time = btn.dataset.time;
    const car = btn.dataset.car;

    const ref = db.ref(
        `fullCars/${adminDate.value}/${time}_${car}`
    );

    try {

        const snap = await ref.get();

        // Đang FULL -> TẮT FULL
        if (snap.exists()) {

            const ok = await showConfirm(
                `${time} ${car}\n\n満車を解除しますか？`
            );

            if (!ok) return;

            await ref.remove();

        }

        // Chưa FULL -> BẬT FULL
        else {

            const ok = await showConfirm(
                `${time} ${car}\n\n満車にしますか？`
            );

            if (!ok) return;

            await ref.set({
                time,
                car,
                full: true,
                updatedAt: Date.now()
            });

        }

        loadReservations();

    } catch (err) {

        console.error(err);
        showToast("保存失敗");

    }

});
const popup = document.getElementById("reservePopup");
const closePopup = document.getElementById("closePopup");
const deleteBtn = document.getElementById("deleteBtn");
const reserveForm = document.getElementById("reserveForm");
const adminDate = document.getElementById("adminDate");
const prevDayBtn = document.getElementById("prevDay");
const nextDayBtn = document.getElementById("nextDay");
const updateBtn = document.getElementById("updateBtn");
const bookingTime = document.getElementById("bookingTime");
const groupIcon =
    document.getElementById("groupIcon");
const existingGroupsSelect = document.getElementById("existingGroupsSelect");
let globalCurrentData = {};
const btnPageEarlys =
    document.querySelectorAll(".btnPageEarly");

const btnPageLates =
    document.querySelectorAll(".btnPageLate");
const pageEarlyView = document.getElementById("pageEarlyView");
const pageLateView = document.getElementById("pageLateView");

// Password handling removed

// Form fields
const inputRoom = document.getElementById("inputRoom");
const inputName = document.getElementById("inputName");
inputName.setAttribute("lang", "ja");
inputName.setAttribute("inputmode", "kana");
inputName.setAttribute("autocomplete", "off");
inputName.setAttribute("autocapitalize", "off");
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

const allBookingsPopup =
    document.getElementById("allBookingsPopup");

const allBookingsList =
    document.getElementById("allBookingsList");

const closeAllBookingsBtn =
    document.getElementById("closeAllBookingsBtn");

let currentReservationRef = null;
let soinetSeatStatus = "";
let stayActive = false;
let isComposingGuestName = false;

const guestNameAllowedPattern =
    /^[A-Za-z\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F\u0020\u3000.'’\-・]*$/u;

function hiraganaToKatakana(value) {
    return value.replace(/[\u3041-\u3096]/g, char =>
        String.fromCharCode(char.charCodeAt(0) + 0x60)
    );
}

function sanitizeGuestName(value) {
    return Array.from(hiraganaToKatakana(value))
        .filter(char => guestNameAllowedPattern.test(char))
        .join("");
}

function isValidGuestName(value) {
    return guestNameAllowedPattern.test(value);
}

function normalizeGuestNameInput() {
    const cleanedName = sanitizeGuestName(inputName.value);

    if (inputName.value !== cleanedName) {
        inputName.value = cleanedName;
    }
}

const seatMap = {
    "06:05_ラッキータクシー": 8, "06:05_ホテル": 6,
    "06:20_ラッキータクシー": 8, "06:20_ホテル": 6,
    "06:40_ラッキータクシー": 8, "06:40_ホテル": 6,
    "07:00_ラッキータクシー": 8, "07:00_ホテル": 6,
    "07:30_ホテル": 6, "08:00_ホテル": 6, "08:30_ホテル": 6,
    "09:00_ホテル": 6, "09:30_ホテル": 6, "10:00_ホテル": 6
};
function getTodayString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// FIX MẤT HÀM GỐC
function isFutureDate(dateStr) {
    return dateStr > getTodayString();
}
// ── TRANG TOGGLE ──
// ── TRANG TOGGLE ──

document.addEventListener("click", function (e) {

    if (e.target.closest(".btnPageEarly")) {

        pageEarlyView.classList.remove("hidden");
        pageLateView.classList.add("hidden");

        document.querySelectorAll(".btnPageEarly")
            .forEach(btn => btn.classList.add("active"));

        document.querySelectorAll(".btnPageLate")
            .forEach(btn => btn.classList.remove("active"));
    }

    if (e.target.closest(".btnPageLate")) {

        pageLateView.classList.remove("hidden");
        pageEarlyView.classList.add("hidden");

        document.querySelectorAll(".btnPageLate")
            .forEach(btn => btn.classList.add("active"));

        document.querySelectorAll(".btnPageEarly")
            .forEach(btn => btn.classList.remove("active"));
    }

});
function getDateString(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function switchPageByTime(time) {
    const earlyHours = ["06:05", "06:20", "06:40", "07:00"];
    const lateHours = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];

    if (lateHours.includes(time)) {
        btnPageLates[0].click();
    }
    else if (earlyHours.includes(time)) {
        btnPageEarlys[0].click();
    }
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

inputName.addEventListener("compositionstart", () => {
    isComposingGuestName = true;
});

inputName.addEventListener("compositionend", () => {
    isComposingGuestName = false;
    normalizeGuestNameInput();
});

inputName.addEventListener("input", () => {
    if (isComposingGuestName) return;
    normalizeGuestNameInput();
});

inputName.addEventListener("blur", () => {
    normalizeGuestNameInput();
});
// =========================
// ENTER KEY FLOW
// Room -> Name -> Adults -> Save
// =========================

inputRoom.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    inputName.focus();
});

inputName.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    selAdults.focus();

    if (selAdults.select) {
        selAdults.select();
    }
});

selAdults.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    reserveForm.requestSubmit();
});

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".reserve-btn");
    if (!btn) return;

    popup.dataset.time = btn.dataset.time;
    popup.dataset.car = btn.dataset.car;

    bookingTime.value = btn.dataset.time;

    popup.dataset.editId = "";
    popup.dataset.editDate = "";

    popup.classList.remove("hidden");
    resetForm();
    populateExistingGroups();
});

function resetForm() {
    reserveForm.reset(); soinetSeatStatus = ""; updateSeatBtns(); stayActive = false;
    stayToggle.textContent = "OFF"; stayToggle.classList.remove("active");
    document.querySelectorAll('.stepper-input input').forEach(input => input.value = 0);
    groupIcon.value = "";
    if (existingGroupsSelect) existingGroupsSelect.value = "";
}

closePopup.addEventListener("click", () => { popup.classList.add("hidden"); });
popup.addEventListener("click", (e) => {

    // chỉ khi click vào nền popup
    if (e.target === popup) {

        popup.classList.add("hidden");

        resetForm();

        popup.dataset.editId = "";

    }

});

reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Kiểm tra bắt buộc nhập Số phòng (Không được để trống)
    // const roomValue = inputRoom.value.trim();


    // 2. Kiểm tra bắt buộc nhập Số hành khách (Người lớn phải lớn hơn 0)
    const adults = Number(selAdults.value) || 0;
    if (adults <= 0) {
        showToast("大人 の人数を入力してください (Vui lòng nhập số lượng người lớn)");
        selAdults.focus();
        return;
    }

    const nameValue = sanitizeGuestName(inputName.value).trim();
    if (!isValidGuestName(nameValue)) {
        showToast("お名前は英字とカタカナだけ入力できます。");
        inputName.focus();
        return;
    }
    inputName.value = nameValue;

    const editId = popup.dataset.editId;
    const saveDate = editId
        ? popup.dataset.editDate
        : adminDate.value;

    // Nếu thỏa mãn cả 2 điều kiện trên thì tiến hành lưu dữ liệu lên Firebase
    const now = Date.now();
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

    const oldTime = editId ? originalTime : bookingTime.value;
    const newTime = bookingTime.value;

    let targetCar = popup.dataset.car;

    // sớm -> muộn
    if (
        earlyHours.includes(oldTime) &&
        lateHours.includes(newTime)
    ) {
        targetCar = "ホテル";
    }

    // muộn -> sớm
    else if (
        lateHours.includes(oldTime) &&
        earlyHours.includes(newTime)
    ) {

        const carChoice = await showSelect(
            "車を選択してください",
            [
                { value: "2", label: "ホテル" },
                { value: "1", label: "ラッキータクシー" }
            ]
        );

        if (carChoice === null) {
            return;
        }

        targetCar =
            carChoice === "2"
                ? "ホテル"
                : "ラッキータクシー";
    }
    const data = {
        bookingSource: "staff",
        date: saveDate,
        time: bookingTime.value,
        car: targetCar,
        groupIcon: groupIcon.value,
        stay: stayActive,
        room: inputRoom.value.trim(),
        name: nameValue,
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
        updatedAt: now
    };
    const allowSave =
        await checkCrowdedWarning(
            saveDate,
            data.time,
            data.car,
            data,
            editId || null
        );

    if (!allowSave) {
        return;
    }
    try {
        if (editId) {

            const oldTime = originalTime;
            const oldCar = popup.dataset.car;

            const isMove =
                oldTime !== data.time ||
                oldCar !== data.car;

            // =====================
            // Chỉ sửa thông tin
            // =====================
            if (!isMove) {

                await db.ref(
                    "reservations/" +
                    saveDate +
                    "/" +
                    editId
                ).update({
                    ...data,
                    updatedAt: now
                });

            }

            // =====================
            // Đổi giờ / đổi xe
            // =====================
            else {

                await db.ref(
                    "reservations/" +
                    saveDate +
                    "/" +
                    editId
                ).update({
                    status: "moved",
                    movedTo: data.time,
                    updatedAt: now
                });

                await db.ref(
                    "reservations/" +
                    data.date
                ).push({
                    ...data,
                    createdAt: now
                });

            }

        } else {

            await db.ref(
                "reservations/" +
                data.date
            ).push({
                ...data,
                createdAt: now
            });

        }
    } catch (error) {
        console.error(error);
        showToast("保存失敗");
        return;
    }

    popup.classList.add("hidden");
    resetForm();
    popup.dataset.editId = "";
    switchPageByTime(data.time);
    loadReservations();
});
function getBookingSeatCount(item) {


    let seats = Number(item.adults || 0);

    if (item.soinetSeat === "ari") {
        seats += Number(item.soinet || 0);
    }

    return seats;
}

async function checkCrowdedWarning(
    date,
    targetTime,
    targetCar,
    bookingData,
    excludeId = null
) {

    const snap =
        await db.ref("reservations/" + date).get();

    const allData = snap.val() || {};

    let usedSeats = 0;

    Object.entries(allData).forEach(([id, item]) => {

        if (
            item.archived ||
            item.status === "canceled" ||
            item.status === "moved"
        ) {
            return;
        }

        if (excludeId && id === excludeId) {
            return;
        }

        if (
            item.time === targetTime &&
            item.car === targetCar
        ) {

            usedSeats += getBookingSeatCount(item);

        }

    });

    const newSeats =
        getBookingSeatCount(bookingData);

    const totalSeats =
        usedSeats + newSeats;

    if (totalSeats >= 7) {

        return await showConfirm(
            `${targetTime} ${targetCar}\n\n` +
            `現在 ${usedSeats}名\n` +
            `追加後 ${totalSeats}名になります。\n\n` +
            `このまま登録しますか？`
        );

    }

    return true;
}
// ── ACTION HANDLING (password disabled) ──
function executePendingAction(actionType, extraData = null) {
    pendingActionType = actionType;
    pendingItemData = extraData;
    executeAction();
}

async function executeAction() {
    try {
        if (pendingActionType === "delete_form") {
            const ref = db.ref(
                "reservations/" +
                popup.dataset.editDate +
                "/" +
                popup.dataset.editId
            );

            await ref.update({
                status: "canceled",
                canceledAt: Date.now(),
                updatedAt: Date.now()
            });

            popup.classList.add("hidden");
            resetForm();
            popup.dataset.editId = "";
        }
        else if (pendingActionType === "delete_quick") {
            if (!pendingItemData) return;

            const ref = db.ref(
                "reservations/" +
                pendingItemData.date +
                "/" +
                pendingItemData.id
            );

            await ref.update({
                archived: true,
                archivedAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        else if (pendingActionType === "move") {
            const movingBooking = dragBooking;

            if (!movingBooking) return;

            const snapshot = await db.ref(
                "reservations/" + movingBooking.date
            ).get();

            const allData = snapshot.val() || {};
            globalCurrentData = allData;

            let usedSeats = 0;

            Object.values(allData).forEach(item => {

                if (
                    item.archived ||
                    item.status === "canceled" ||
                    item.status === "moved"
                ) {
                    return;
                }

                if (
                    item.time === pendingTargetTime &&
                    item.car === pendingTargetCar
                ) {

                    usedSeats += getBookingSeatCount(item);

                }

            });

            const moveSeats =
                getBookingSeatCount(movingBooking);
            const crowdedTotal =
                usedSeats + moveSeats;

            if (crowdedTotal >= 7) {

                const ok = await showConfirm(
                    `${pendingTargetTime} ${pendingTargetCar}\n\n` +
                    `移動後 ${crowdedTotal}名になります。\n\n` +
                    `移動しますか？`
                );

                if (!ok) {

                    dragBooking = null;
                    return;

                }

            }

            const maxSeats =
                seatMap[
                pendingTargetTime +
                "_" +
                pendingTargetCar
                ];

            if (
                usedSeats + moveSeats >
                maxSeats
            ) {

                showToast(
                    `満席です。\n\n残り ${maxSeats - usedSeats
                    }席`
                );

                dragBooking = null;
                return;
            }
            const parentRef = db.ref(
                "reservations/" +
                movingBooking.date
            );

            const newRef = parentRef.push();

            const newData = {
                ...movingBooking,
                time: pendingTargetTime,
                car: pendingTargetCar,
                movedFrom: movingBooking.time,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            delete newData.id;
            delete newData.status;
            delete newData.movedTo;

            const updates = {};
            updates[newRef.key] = newData;

            updates[movingBooking.id + "/status"] = "moved";
            updates[movingBooking.id + "/movedTo"] = pendingTargetTime;
            updates[movingBooking.id + "/updatedAt"] = Date.now();

            await parentRef.update(updates);

            const earlyHours = ["06:05", "06:20", "06:40", "07:00"];
            const lateHours = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];

            if (lateHours.includes(pendingTargetTime)) {
                btnPageLates[0].click();
            }
            else if (earlyHours.includes(pendingTargetTime)) {
                btnPageEarlys[0].click();
            }

            dragBooking = null;
        }
    }
    catch (error) {
        console.error(error);
        showToast("更新失敗");
    }
    finally {
        pendingItemData = null;
    }
}
function applySearchFilter() {
    const keyword =
        searchInput.value
            .trim()
            .toLowerCase();

    document.querySelectorAll(".guest-line")
        .forEach(line => {

            const room = (line.dataset.room || "").toLowerCase();
            const name = (line.dataset.name || "").toLowerCase();
            const time = (line.dataset.time || "").toLowerCase(); // Thêm lấy dữ liệu giờ

            // Thêm điều kiện lọc theo giờ xe chạy
            const matched =
                room.includes(keyword) ||
                name.includes(keyword) ||
                time.includes(keyword);

            line.style.display =
                matched ? "" : "none";

        });

}
deleteBtn.addEventListener("click", async () => {
    if (!popup.dataset.editId) return;

    const ok = await showConfirm(
        `R${inputRoom.value || "-"} ${inputName.value || ""}様 の予約をキャンセルしますか？`
    );

    if (!ok) return;

    executePendingAction("delete_form");
});
// ==========================================
// KHAI BÁO BỔ SUNG CÁC BIẾN THIẾU Ở ĐẦU FILE (Nếu chưa có)
// ==========================================
const clearSearchBtn = document.getElementById("clearSearchBtn");
const searchResults = document.getElementById("searchResults");


// ── LOAD RESERVATIONS ──
function loadReservations() {

    const selectedDate = adminDate.value;
    const requestId = ++loadReservationsRequestId;

    fullCarMap = {};

    if (currentReservationRef) {
        currentReservationRef.off();
        currentReservationRef = null;
    }

    db.ref("fullCars/" + selectedDate)
        .once("value")
        .then(fullSnap => {

            if (
                requestId !== loadReservationsRequestId ||
                selectedDate !== adminDate.value
            ) {
                return;
            }

            fullCarMap = fullSnap.val() || {};

            currentReservationRef =
                db.ref("reservations/" + selectedDate);

            currentReservationRef.on("value", (snapshot) => {

                if (
                    requestId !== loadReservationsRequestId ||
                    selectedDate !== adminDate.value
                ) {
                    return;
                }

                const data = snapshot.val();
                globalCurrentData = data || {};

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
                        item.id = id;

                        if (
                            item.archived ||
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

                    const [time, car] = key.split(/_(.+)/);

                    const btn = document.querySelector(
                        `.reserve-btn[data-time="${time}"][data-car="${car}"]`
                    );

                    if (!btn) return;

                    const td = btn.closest(".car-cell-box");
                    if (!td) return;

                    const emptyText = td.querySelector(".empty-text");
                    if (!emptyText) return;

                    const used = usedMap[key] || 0;
                    const max = seatMap[key];
                    const remain = max - used;

                    if (remain <= 0) {
                        emptyText.innerHTML =
                            `予約済 <span class="seat-count-num">${used}</span>名 <span class="seat-full-label">満車</span>`;
                        emptyText.classList.add("full-seat");
                        return;
                    }

                    if (fullCarMap[key]) {
                        emptyText.innerHTML =
                            `予約済 <span class="seat-count-num">${used}</span>名 <span class="seat-full-label">満車</span>`;
                        emptyText.classList.add("full-seat");
                        return;
                    }

                    emptyText.innerHTML =
                        `予約済 <span class="seat-count-num">${used}</span>名`;

                    if (remain === 1) {
                        emptyText.classList.add("few-seat");
                    }
                });

                Object.keys(fullCarMap).forEach(key => {

                    const [time, car] =
                        key.split(/_(.+)/);

                    const btn =
                        document.querySelector(
                            `.reserve-btn[data-time="${time}"][data-car="${car}"]`
                        );

                    if (!btn) return;

                    const td =
                        btn.closest(".car-cell-box");

                    if (!td) return;

                    const emptyText =
                        td.querySelector(".empty-text");

                    if (!emptyText) return;

                    const used = usedMap[key] || 0;

                    emptyText.innerHTML =
                        `予約済 <span class="seat-count-num">${used}</span>名 <span class="seat-full-label">満車</span>`;

                    emptyText.classList.add("full-seat");

                });

                if (!data) return;
                const bookingList =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));
                bookingList.sort((a, b) => {

                    const aGroup =
                        a.groupIcon ? 1 : 0;

                    const bGroup =
                        b.groupIcon ? 1 : 0;

                    if (aGroup !== bGroup) {
                        return bGroup - aGroup;
                    }

                    return (
                        Number(a.createdAt || 0)
                        -
                        Number(b.createdAt || 0)
                    );

                });
                // =========================
                // RENDER BOOKINGS
                // =========================

                const roomCountMap = {};
                const nameCountMap = {};

                Object.values(data).forEach(item => {
                    if (
                        item.archived ||
                        item.status === "canceled" ||
                        item.status === "moved"
                    ) {
                        return;
                    }

                    const roomKey = String(item.room || "").trim().toLowerCase();
                    const nameKey = String(item.name || "").trim().toLowerCase();

                    if (roomKey) {
                        roomCountMap[roomKey] = (roomCountMap[roomKey] || 0) + 1;
                    }

                    if (nameKey) {
                        nameCountMap[nameKey] = (nameCountMap[nameKey] || 0) + 1;
                    }
                });

                bookingList.forEach(item => {

                    if (item.archived) {
                        return;
                    }

                    item.date = selectedDate;

                    const btn = document.querySelector(
                        `.reserve-btn[data-time="${item.time}"][data-car="${item.car}"]`
                    );

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

                    const isNewToday =
                        !isCanceled &&
                        !isMoved &&
                        !isDone &&
                        isTodayBooking(item.date) &&
                        isTodayTimestamp(item.createdAt);

                    const roomKey = String(item.room || "").trim().toLowerCase();
                    const nameKey = String(item.name || "").trim().toLowerCase();

                    const isDuplicateBooking =
                        !isCanceled &&
                        !isMoved &&
                        (
                            (roomKey && roomCountMap[roomKey] > 1) ||
                            (nameKey && nameCountMap[nameKey] > 1)
                        );

                    const line = document.createElement("div");
                    line.className = "guest-line";
                    line.dataset.time = item.time || "";
                    line.dataset.room = item.room || "";
                    line.dataset.name = item.name || "";

                    if (isDone) line.classList.add("is-done");
                    if (isMoved) line.classList.add("is-moved");
                    if (isCanceled) line.classList.add("is-canceled");
                    if (isNewToday) line.classList.add("is-new-today");
                    if (isDuplicateBooking) line.classList.add("is-duplicate-booking");

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
                    if (Number(item.large || 0) > 0) luggageText += ` 大${item.large})`;
                    if (Number(item.medium || 0) > 0) luggageText += ` 中${item.medium})`;
                    if (Number(item.small || 0) > 0) luggageText += ` 小${item.small})`;

                    if (item.note && item.note.trim() !== "") {
                        luggageText += ` (${item.note.trim()})`;
                    }

                    const stayText = item.stay ? `<span class="stay-label">[ステイ]</span>` : "";
                    const groupIconText = item.groupIcon ? `<span class="group-icon">${item.groupIcon}</span>` : "";

                    const mainContentBlock = document.createElement("div");
                    mainContentBlock.className = "guest-main-content-block";
                    mainContentBlock.innerHTML = `
                        <span class="flat-room">
                            ${isDuplicateBooking ? "<span class='duplicate-star'>★</span>" : ""}
                            ${item.room ? `R${item.room}` : "-"}
                        </span>
                        <span class="guest-name-text">${item.name || ""}</span>
                        ${paxDisplay}
                        ${stayText}
                        <span class="lug-text-summary">${luggageText}</span>
                        ${groupIconText}
                    `;

                    const rightActionsBlock = document.createElement("div");
                    rightActionsBlock.className = "guest-right-actions-block";

                    if (isMoved && item.movedTo) {
                        rightActionsBlock.innerHTML += `<span class="dest-label">→ ${item.movedTo} 変</span>`;
                    }

                    if (isNewToday) {
                        rightActionsBlock.innerHTML += `<span class="new-booking-label">新</span>`;
                    }

                    if (isCanceled || isMoved) {
                        const statusLabel = document.createElement("span");
                        statusLabel.className = "cxl-label";
                        statusLabel.textContent = isCanceled ? "CXL" : " ";
                        rightActionsBlock.appendChild(statusLabel);

                        const quickDelBtn = document.createElement("button");
                        quickDelBtn.className = "quick-del-btn";
                        quickDelBtn.innerHTML = "&times;";
                        quickDelBtn.type = "button";

                        quickDelBtn.addEventListener("click", async (e) => {
                            e.stopPropagation();
                            const ok = await showConfirm(`R${item.room || "-"} ${item.name || ""}様\n\n完全削除しますか？`);
                            if (!ok) return;
                            executePendingAction("delete_quick", item);
                        });

                        rightActionsBlock.appendChild(quickDelBtn);
                    }

                    // ── TỐI ƯU HÓA LOGIC KÉO THẢ (DRAG & DROP) ──
                    let suppressNextClick = false;

                    if (!isCanceled && !isMoved) {
                        line.draggable = false;
                        line.style.touchAction = "none"; // Ngăn trình duyệt cuộn trang khi đang kéo thả
                        let pointerDragState = null;
                        let lastPageSwitchAt = 0;

                        const clearDragUi = () => {
                            line.classList.remove("dragging");
                            clearDragOverCells();
                        };

                        const getDropBoxAt = (clientX, clientY) => {
                            const target = document.elementFromPoint(clientX, clientY);
                            return target ? target.closest(".car-cell-box") : null;
                        };

                        const handlePointerMove = (e) => {
                            if (!pointerDragState || pointerDragState.pointerId !== e.pointerId) return;

                            const moveX = Math.abs(e.clientX - pointerDragState.startX);
                            const moveY = Math.abs(e.clientY - pointerDragState.startY);

                            // Nếu chưa kích hoạt trạng thái kéo và di chuyển chưa đủ 8px thì bỏ qua
                            if (!pointerDragState.dragging && Math.max(moveX, moveY) < 8) return;

                            // Bắt đầu trạng thái kéo
                            if (!pointerDragState.dragging) {
                                pointerDragState.dragging = true;
                                suppressNextClick = true; // Chặn sự kiện click mở popup
                                dragBooking = item;
                                line.classList.add("dragging");
                            }

                            e.preventDefault();

                            // 1. Xử lý tự động chuyển trang/tab khi rê qua nút Sáng/Chiều
                            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
                            const pageButton = targetEl ? targetEl.closest(".btnPageEarly, .btnPageLate") : null;
                            if (pageButton) {
                                const now = Date.now();
                                if (now - lastPageSwitchAt > 500) { // Giới hạn kiểm tra mỗi 500ms
                                    lastPageSwitchAt = now;
                                    pageButton.click();
                                }
                            }

                            // 2. Highlight ô (Cell) đang rê chuột qua
                            const dropBox = getDropBoxAt(e.clientX, e.clientY);
                            clearDragOverCells();
                            if (dropBox) dropBox.classList.add("drag-over");
                        };

                        const handlePointerUp = async (e) => {
                            if (!pointerDragState || pointerDragState.pointerId !== e.pointerId) return;
                            
                            const wasDragging = pointerDragState.dragging;
                            pointerDragState = null;
                            
                            // Gỡ bỏ các event lắng nghe toàn cục
                            document.removeEventListener("pointermove", handlePointerMove);
                            document.removeEventListener("pointerup", handlePointerUp);
                            document.removeEventListener("pointercancel", handlePointerCancel);

                            if (!wasDragging) return; // Nếu chỉ là click thông thường thì dừng lại ở đây

                            e.preventDefault();
                            const dropBox = getDropBoxAt(e.clientX, e.clientY);
                            clearDragUi();

                            if (!dropBox) {
                                dragBooking = null;
                                return;
                            }

                            pendingTargetTime = dropBox.dataset.time;
                            pendingTargetCar = dropBox.dataset.car;

                            // Nếu thả trúng ngay ô cũ thì hủy bỏ hành động
                            if (item.time === pendingTargetTime && item.car === pendingTargetCar) {
                                dragBooking = null;
                                return;
                            }

                            // Xác nhận và thực hiện di chuyển
                            const displayRoom = item.room ? `R${item.room}` : "部屋なし";
                            const ok = await showConfirm(`${displayRoom} を ${pendingTargetTime} (${pendingTargetCar}) へ 移動しますか？`);
                            if (ok) {
                                executePendingAction("move");
                            } else {
                                dragBooking = null; // Reset nếu hủy
                            }
                        };

                        const handlePointerCancel = () => {
                            pointerDragState = null;
                            document.removeEventListener("pointermove", handlePointerMove);
                            document.removeEventListener("pointerup", handlePointerUp);
                            document.removeEventListener("pointercancel", handlePointerCancel);
                            dragBooking = null;
                            clearDragUi();
                        };

                        // Đăng ký sự kiện nhấn xuống ban đầu
                        line.addEventListener("pointerdown", (e) => {
                            if (e.target.closest(".quick-del-btn")) return; // Không kích hoạt kéo khi bấm nút xóa nhanh
                            if (e.pointerType === "mouse" && e.button !== 0) return; // Chỉ cho phép chuột trái

                            pointerDragState = {
                                pointerId: e.pointerId,
                                startX: e.clientX,
                                startY: e.clientY,
                                dragging: false
                            };

                            document.addEventListener("pointermove", handlePointerMove, { passive: false });
                            document.addEventListener("pointerup", handlePointerUp);
                            document.addEventListener("pointercancel", handlePointerCancel);
                        });
                    }

                    let clickTimer = null;
                    line.addEventListener("click", (e) => {
                        if (suppressNextClick) {
                            suppressNextClick = false;
                            return;
                        }
                        if (e.target.classList.contains("quick-del-btn")) return;

                        if (clickTimer) {
                            clearTimeout(clickTimer);
                            clickTimer = null;
                            toggleDoneStatus(item);
                        } else {
                            clickTimer = setTimeout(() => {
                                openEditPopup(item);
                                clickTimer = null;
                            }, 250);
                        }
                    });

                    line.appendChild(mainContentBlock);
                    line.appendChild(rightActionsBlock);
                    guestRow.appendChild(line);
                });

                applySearchFilter();
            });
        })
        .catch(error => {
            console.error(error);
            showToast("予約データの読み込みに失敗しました");
        });
} // <--- ĐÓNG ĐÚNG HÀM loadReservations TẠI ĐÂY!


// ==========================================
// CÁC HÀM PHỤ TRỢ & SỰ KIỆN TOÀN CỤC (ĐƯỢC ĐƯA RA NGOÀI)
// ==========================================

function openEditPopup(item) {
    document.getElementById("timePreview").innerHTML = "";
    popup.classList.remove("hidden");
    popup.dataset.editId = item.id;
    popup.dataset.editDate = item.date;
    popup.dataset.time = item.time;
    originalTime = item.time;
    bookingTime.value = item.time;

    groupIcon.value = item.groupIcon || "";
    populateExistingGroups(); 
    if (existingGroupsSelect) existingGroupsSelect.value = item.groupIcon || "";
    
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
}

async function toggleDoneStatus(item) {
    const isCanceled = item.status === "canceled";
    const isMoved = item.status === "moved";
    const isDone = item.status === "done";
    if (!isTodayBooking(item.date)) return;
    if (isMoved) return;

    const ref = db.ref("reservations/" + item.date + "/" + item.id);
    try {
        if (isDone || isCanceled) {
            await ref.child("status").remove();
        } else {
            await ref.update({ status: "done" });
        }
    } catch (error) {
        console.error(error);
        showToast("更新失敗");
    }
}

bookingTime.addEventListener("change", () => {
    const newTime = bookingTime.value;
    const wrap = document.getElementById("timePreview");

    if (!originalTime || originalTime === newTime) {
        wrap.innerHTML = "";
        return;
    }

    wrap.innerHTML = `
        <span class="old-time">${originalTime}</span>
        <span class="time-arrow">→</span>
        <span class="new-time">${newTime}</span>
    `;
});

document.querySelectorAll('.stepper-input').forEach(stepper => {
    const minusBtn = stepper.querySelector('.minus'); 
    const plusBtn = stepper.querySelector('.plus'); 
    const input = stepper.querySelector('input[type="number"]');
    
    minusBtn.addEventListener('click', () => { 
        let val = parseInt(input.value) || 0; 
        let min = parseInt(input.min) || 0; 
        if (val > min) input.value = val - 1; 
    });
    plusBtn.addEventListener('click', () => { 
        let val = parseInt(input.value) || 0; 
        let max = parseInt(input.max) || 99; 
        if (val < max) input.value = val + 1; 
    });
});

function isTodayBooking(dateStr) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return dateStr === `${y}-${m}-${d}`;
}

function isTodayTimestamp(timestamp) {
    if (!timestamp) return false;
    const createdDate = new Date(Number(timestamp));
    if (Number.isNaN(createdDate.getTime())) return false;
    return getDateString(createdDate) === getTodayString();
}

searchInput.addEventListener("input", () => {
    applySearchFilter();
});

const searchBtn = document.getElementById("searchBtn");

if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        document.querySelectorAll(".guest-line").forEach(line => {
            line.style.display = "";
        });
        if (searchResults) {
            searchResults.innerHTML = "";
        }
        searchInput.focus();
    });
}

// ========================================
// XỬ LÝ SỰ KIỆN TÌM KIẾM & CLICK MỞ POPUP (ĐÃ CẬP NHẬT CHUẨN)
// ========================================
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const keyword = searchInput.value.trim().toLowerCase();
        if (!searchResults) return;
        searchResults.innerHTML = "";

        document.querySelectorAll(".guest-line").forEach(line => {
            const room = (line.dataset.room || "").toLowerCase();
            const name = (line.dataset.name || "").toLowerCase();
            const time = (line.dataset.time || "").toLowerCase();

            if (room.includes(keyword) || name.includes(keyword) || time.includes(keyword)) {
                // Tạo phần tử div kết quả tìm kiếm để gán sự kiện click trực tiếp
                const resultItem = document.createElement("div");
                resultItem.className = "searchResults";
                resultItem.style.cssText = "padding: 8px 10px; border-bottom: 1px solid #e2e8f0; cursor: pointer;";
                
                resultItem.innerHTML = `
                    <span style="font-weight: bold; color: #2563eb; margin-right: 8px;">[${line.dataset.time || "-"}]</span> 
                    ${line.innerText}
                `;

                // Giả lập hành vi click vào dòng gốc ở bảng chính khi click vào kết quả này
                resultItem.addEventListener("click", () => {
                    line.click(); 
                });

                searchResults.appendChild(resultItem);
            }
        });
    });
}

// ========================================
// EXPORT EXCEL
// ========================================
document.querySelectorAll(".exportExcelBtn").forEach(btn => {
    btn.addEventListener("click", exportExcel);
});

// ========================================
// XUẤT EXCEL HỖ TRỢ HIỂN THỊ XE ĐẦY (FULLCARS)
// ========================================
async function exportExcel() {
    try {
        const date = adminDate.value;
        const response = await fetch("./bus_booking1.xlsx");
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheetEarly = workbook.getWorksheet("6-7");
        const sheetLate = workbook.getWorksheet("7-10");

        const weekList = ["日", "月", "火", "水", "木", "金", "土"];
        const dateObj = new Date(date);
        const week = weekList[dateObj.getDay()];
        const [year, month, day] = date.split("-");

        const headerText = `${Number(month)}月 ${Number(day)}日（${week}）`;
        if (sheetEarly) sheetEarly.getCell("D1").value = headerText;
        if (sheetLate) sheetLate.getCell("D1").value = headerText;

        // 1. LẤY DỮ LIỆU ĐẶT PHÒNG KHÁCH HÀNG
        const snapshot = await db.ref("reservations/" + date).get();
        const data = snapshot.val() || {};

        // 2. LẤY DỮ LIỆU KHÓA XE ĐẦY (FULLCARS) THEO YÊU CẦU CỦA BẠN
        const fullSnap = await db.ref("fullCars/" + date).once("value");
        const fullCars = fullSnap.val() || {};

        // Kiểm tra nếu cả lịch đặt xe lẫn danh sách khóa xe đều trống thì mới báo không có dữ liệu
        if (Object.keys(data).length === 0 && Object.keys(fullCars).length === 0) {
            alert("データなし");
            return;
        }

        const earlyMap = {
            "06:05_ラッキータクシー": "C5", "06:05_ホテル": "D5",
            "06:20_ラッキータクシー": "C15", "06:20_ホテル": "D15",
            "06:40_ラッキータクシー": "C25", "06:40_ホテル": "D25",
            "07:00_ラッキータクシー": "C35", "07:00_ホテル": "D35"
        };
        const lateMap = {
            "07:30_ホテル": "B3", "08:00_ホテル": "B14", "08:30_ホテル": "B25",
            "09:00_ホテル": "D3", "09:30_ホテル": "D14", "10:00_ホテル": "D25"
        };

        // Xóa dữ liệu cũ trên các ô trong file mẫu trước khi điền dữ liệu mới
        if (sheetEarly) {
            Object.values(earlyMap).forEach(addr => { sheetEarly.getCell(addr).value = ""; });
        }
        if (sheetLate) {
            Object.values(lateMap).forEach(addr => { sheetLate.getCell(addr).value = ""; });
        }

        // Khởi tạo mảng trống cho tất cả các tuyến cố định nhằm đảm bảo kiểm tra được trạng thái khóa xe
        const grouped = {};
        const allKeys = [...Object.keys(earlyMap), ...Object.keys(lateMap)];
        allKeys.forEach(key => {
            grouped[key] = [];
        });

        // 3. GOM NHÓM DANH SÁCH KHÁCH HÀNG ĐẶT XE ĐANG HOẠT ĐỘNG
        Object.values(data).forEach(item => {
            if (item.archived || item.status === "canceled" || item.status === "moved") return;

            const key = item.time + "_" + item.car;
            if (!grouped[key]) grouped[key] = [];

            let luggage = "";
            if (item.tokudai > 0) luggage += `特大${item.tokudai} `;
            if (item.large > 0) luggage += `大${item.large} `;
            if (item.medium > 0) luggage += `中${item.medium} `;
            if (item.small > 0) luggage += `小${item.small} `;
            const stay = item.stay ? "ステイ" : "";
            
            if (item.note && item.note.trim()) {
                luggage += `(${item.note.trim()}) `;
            }

            const adults = Number(item.adults || 0);
            const inf = Number(item.soinet || 0);
            let paxText = `${adults}名`;

            if (inf > 0) {
                const seatLabel = item.soinetSeat === "ari" ? "席あり" : "席なし";
                paxText += ` + ${inf}INF(${seatLabel})`;
            }

            const iconText = item.groupIcon ? ` ${item.groupIcon}` : "";
            const text = `${item.room || ""}｜${item.name || ""}様｜${paxText} ${luggage}${iconText}${stay}`.trim();

            grouped[key].push(text);
        });

        // 4. KIỂM TRA TRẠNG THÁI KHÓA XE (FULLCARS) ĐỂ ĐƯA VÀO FILE EXCEL
        allKeys.forEach(key => {
            if (fullCars[key]) {
                // Nếu tuyến xe này bị bấm nút "満車" trên giao diện Admin, thêm nhãn cảnh báo vào Excel
                grouped[key].push("★満車★");
            }
        });

        // 5. TIẾN HÀNH GHI DỮ LIỆU ĐÃ GOM NHÓM XUỐNG CÁC Ô SỰ KIỆN TRONG EXCEL
        Object.entries(grouped).forEach(([key, list]) => {
            let sheet = null;
            let baseCell = null;

            if (earlyMap[key]) { sheet = sheetEarly; baseCell = earlyMap[key]; }
            else if (lateMap[key]) { sheet = sheetLate; baseCell = lateMap[key]; }

            if (!sheet || !baseCell) return;

            const col = baseCell.replace(/[0-9]/g, "");
            const baseRow = parseInt(baseCell.replace(/\D/g, ""));

            list.forEach((text, i) => {
                const row = baseRow + i;
                sheet.getCell(`${col}${row}`).value = text;
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `bus_${date}.xlsx`);

    } catch (error) {
        console.error(error);
        alert("Excel出力エラー");
    }
}

// =====================================
// ALL BOOKINGS POPUP
// =====================================
document.querySelectorAll(".showAllBookingsBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
        const date = adminDate.value;
        const snapshot = await db.ref("reservations/" + date).get();
        const data = snapshot.val();

        allBookingsList.innerHTML = "";

        if (!data) {
            allBookingsList.innerHTML = "<div>データなし</div>";
            allBookingsPopup.classList.remove("hidden");
            return;
        }

        const arr = Object.entries(data).map(([id, item]) => ({ id, ...item }));
        const filtered = arr.filter(item => !item.archived && item.status !== "canceled" && item.status !== "moved");

        filtered.sort((a, b) => (parseInt(a.room) || 0) - (parseInt(b.room) || 0));

        filtered.forEach(item => {
            const div = document.createElement("div");
            div.className = "booking-list-line";

            let luggage = "";
            if (item.tokudai > 0) luggage += ` 特大${item.tokudai}`;
            if (item.large > 0) luggage += ` 大${item.large}`;
            if (item.medium > 0) luggage += ` 中${item.medium}`;
            if (item.small > 0) luggage += ` 小${item.small}`;

            div.innerHTML = `
                <div class="booking-time">${item.time}</div>
                <div class="booking-room">R${item.room || "-"}</div>
                <div class="booking-name">${item.name || ""}${luggage}</div>
                <div class="booking-pax">${item.adults || 0}名</div>
            `;
            allBookingsList.appendChild(div);
        });

        allBookingsPopup.classList.remove("hidden");
    });
});

function populateExistingGroups() {
    if (!existingGroupsSelect) return;
    existingGroupsSelect.innerHTML = '<option value="">選択...</option>';
    const usedIcons = new Set();

    Object.values(globalCurrentData).forEach(item => {
        if (item.archived || item.status === "canceled" || item.status === "moved") return;
        if (item.groupIcon && item.groupIcon.trim() !== "") {
            usedIcons.add(item.groupIcon);
        }
    });

    usedIcons.forEach(icon => {
        const option = document.createElement("option");
        option.value = icon;
        option.textContent = icon;
        existingGroupsSelect.appendChild(option);
    });
}

if (existingGroupsSelect) {
    existingGroupsSelect.addEventListener("change", function () {
        if (this.value !== "") {
            document.getElementById("groupIcon").value = this.value;
        }
    });
}

if (closeAllBookingsBtn) {
    closeAllBookingsBtn.addEventListener("click", () => {
        allBookingsPopup.classList.add("hidden");
    });
}

if (allBookingsPopup) {
    allBookingsPopup.addEventListener("click", (e) => {
        if (e.target === allBookingsPopup) {
            allBookingsPopup.classList.add("hidden");
        }
    });
}

// Chạy khởi tạo dữ liệu lần đầu tiên khi tải trang
loadReservations();
