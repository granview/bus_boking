// ── FIREBASE CONFIG ──
let dragBooking = null;
let touchDragBooking = null;
let touchDraggingEl = null;

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

            const ok = confirm(
                `${time} ${car}\n\n満車を解除しますか？`
            );

            if (!ok) return;

            await ref.remove();

        }

        // Chưa FULL -> BẬT FULL
        else {

            const ok = confirm(
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
        alert("保存失敗");

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
document.addEventListener("DOMContentLoaded", () => {

    const switchToEarly = () => {

        btnPageEarlys.forEach(btn =>
            btn.classList.add("active")
        );

        btnPageLates.forEach(btn =>
            btn.classList.remove("active")
        );

        pageEarlyView.classList.remove("hidden");
        pageLateView.classList.add("hidden");
    };

    const switchToLate = () => {

        btnPageLates.forEach(btn =>
            btn.classList.add("active")
        );

        btnPageEarlys.forEach(btn =>
            btn.classList.remove("active")
        );

        pageLateView.classList.remove("hidden");
        pageEarlyView.classList.add("hidden");
    };

    btnPageEarlys.forEach(btn => {
        btn.addEventListener("click", switchToEarly);
    });

    btnPageLates.forEach(btn => {
        btn.addEventListener("click", switchToLate);
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

    popup.dataset.editId = "";
    popup.dataset.editDate = "";

    popup.classList.remove("hidden");
    resetForm();
});

function resetForm() {
    reserveForm.reset(); soinetSeatStatus = ""; updateSeatBtns(); stayActive = false;
    stayToggle.textContent = "OFF"; stayToggle.classList.remove("active");
    document.querySelectorAll('.stepper-input input').forEach(input => input.value = 0);
}

closePopup.addEventListener("click", () => { popup.classList.add("hidden"); });

reserveForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Kiểm tra bắt buộc nhập Số phòng (Không được để trống)
    const roomValue = inputRoom.value.trim();


    // 2. Kiểm tra bắt buộc nhập Số hành khách (Người lớn phải lớn hơn 0)
    const adults = Number(selAdults.value) || 0;
    if (adults <= 0) {
        alert("大人 の人数を入力してください (Vui lòng nhập số lượng người lớn)");
        selAdults.focus();
        return;
    }

    const nameValue = sanitizeGuestName(inputName.value).trim();
    if (!isValidGuestName(nameValue)) {
        alert("お名前は英字とカタカナだけ入力できます。");
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
    const data = {
        bookingSource: "staff",
        date: saveDate,
        time: popup.dataset.time,
        car: popup.dataset.car,
        stay: stayActive,
        room: roomValue, // Sử dụng giá trị đã trim khoảng trắng
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

    try {
        if (editId) {
            await db.ref("reservations/" + saveDate + "/" + editId).update({
                ...data,
                updatedAt: now
            });
        } else {
            await db.ref("reservations/" + data.date).push({
                ...data,
                createdAt: now
            });
        }
    } catch (error) {
        console.error(error);
        alert("保存失敗");
        return;
    }

    popup.classList.add("hidden");
    resetForm();
    popup.dataset.editId = "";
});

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
            if (!dragBooking) return;

            const parentRef = db.ref(
                "reservations/" +
                dragBooking.date
            );

            const newRef = parentRef.push();

            const newData = {
                ...dragBooking,
                time: pendingTargetTime,
                car: pendingTargetCar,
                movedFrom: dragBooking.time,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            delete newData.id;
            delete newData.status;
            delete newData.movedTo;

            const updates = {};
            updates[newRef.key] = newData;

            updates[dragBooking.id + "/status"] = "moved";
            updates[dragBooking.id + "/movedTo"] = pendingTargetTime;
            updates[dragBooking.id + "/updatedAt"] = Date.now();

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
        alert("更新失敗");
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
deleteBtn.addEventListener("click", () => {
    if (!popup.dataset.editId) return;

    const ok = confirm(
        `R${inputRoom.value || "-"} ${inputName.value || ""}様 の予約をキャンセルしますか？`
    );

    if (!ok) return;

    executePendingAction("delete_form");
});

// ── LOAD RESERVATIONS ──
function loadReservations() {

    const selectedDate = adminDate.value;

    db.ref("fullCars/" + selectedDate).once("value")
        .then(fullSnap => {

            const fullData = fullSnap.val() || {};

            Object.keys(fullData).forEach(key => {

                const [time, car] = key.split(/_(.+)/);

                const btn = document.querySelector(
                    `.reserve-btn[data-time="${time}"][data-car="${car}"]`
                );

                if (!btn) return;

                const td = btn.closest(".car-cell-box");
                if (!td) return;

                const emptyText =
                    td.querySelector(".empty-text");

                if (!emptyText) return;

                emptyText.innerHTML =
                    `予約済 <span class="seat-count-num">満車</span>`;

                emptyText.classList.add("full-seat");
            });

        });


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
            db.ref("fullCars/" + selectedDate)
                .once("value")
                .then(fullSnap => {

                    const fullCars = fullSnap.val() || {};

                    Object.keys(fullCars).forEach(key => {

                        const [time, car] = key.split(/_(.+)/);

                        const btn = document.querySelector(
                            `.reserve-btn[data-time="${time}"][data-car="${car}"]`
                        );

                        if (!btn) return;

                        const td = btn.closest(".car-cell-box");
                        if (!td) return;

                        const emptyText =
                            td.querySelector(".empty-text");

                        if (!emptyText) return;

                        emptyText.innerHTML =
                            `予約済 <span class="seat-count-num">0</span>名 <span class="seat-full-label">満車</span>`;

                        emptyText.classList.add("full-seat");
                    });

                });

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



        if (!data) return;

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

        Object.entries(data).forEach(([id, item]) => {

            if (item.archived) return;

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

            const isNewToday =
                !isCanceled &&
                !isMoved &&
                !isDone &&
                isTodayBooking(item.date) &&
                isTodayTimestamp(item.createdAt);

            const roomKey =
                String(item.room || "").trim().toLowerCase();

            const nameKey =
                String(item.name || "").trim().toLowerCase();

            const isDuplicateBooking =
                !isCanceled &&
                !isMoved &&
                (
                    (roomKey && roomCountMap[roomKey] > 1) ||
                    (nameKey && nameCountMap[nameKey] > 1)
                );

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

            if (isNewToday) {
                line.classList.add("is-new-today");
            }

            if (isDuplicateBooking) {
                line.classList.add("is-duplicate-booking");
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
                        ${isDuplicateBooking ? "<span class='duplicate-star'>★</span>" : ""}${item.room ? `R${item.room}` : "-"}
                    </span>

                    <span class="guest-name-text">
                        ${item.name || ""}
                    </span>様
                    ${paxDisplay}
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
                            → ${item.movedTo} 変
                        </span>
                    `;

            }

            if (isNewToday) {

                rightActionsBlock.innerHTML += `
                        <span class="new-booking-label">
                            新
                        </span>
                    `;

            }

            // canceled delete button
            if (isCanceled) {
                const cxlLabel = document.createElement("span");

                cxlLabel.className = "cxl-label";

                cxlLabel.textContent = "CXL";

                rightActionsBlock.appendChild(cxlLabel);


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

                        const ok = confirm(
                            `R${item.room || "-"} ${item.name || ""}様\n\nこの予約を完全削除しますか？\n削除後は元に戻せません。`
                        );

                        if (!ok) return;

                        executePendingAction(
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
            // DRAG DESKTOP + IPAD
            // =========================

            if (!isCanceled && !isMoved) {

                line.draggable = true;

                // DESKTOP
                line.addEventListener("dragstart", (e) => {

                    dragBooking = item;

                    line.classList.add("dragging");

                    e.dataTransfer.effectAllowed = "move";

                });

                line.addEventListener("dragend", () => {

                    line.classList.remove("dragging");

                    document.querySelectorAll(".car-cell-box")
                        .forEach(td => {

                            td.classList.remove("drag-over");

                        });

                });

                // =========================
                // TOUCH IPAD / MOBILE
                // =========================

                line.addEventListener("touchstart", (e) => {

                    touchDragBooking = item;

                    touchDraggingEl = line;

                    line.classList.add("dragging");

                }, { passive: false });

                line.addEventListener("touchmove", (e) => {

                    if (!touchDragBooking) return;

                    if (e.cancelable) {
                        e.preventDefault();
                    }

                    const touch = e.touches[0];

                    const target =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    const dropBox =
                        target
                            ? target.closest(".car-cell-box")
                            : null;

                    document.querySelectorAll(".car-cell-box")
                        .forEach(td => {

                            td.classList.remove("drag-over");

                        });

                    if (dropBox) {

                        dropBox.classList.add("drag-over");

                    }

                }, { passive: false });
                window.addEventListener("touchcancel", () => {
                    touchDragBooking = null;
                });

                line.addEventListener("touchend", async (e) => {

                    if (!touchDragBooking) return;

                    line.classList.remove("dragging");

                    const touch =
                        e.changedTouches[0];

                    const target =
                        document.elementFromPoint(
                            touch.clientX,
                            touch.clientY
                        );

                    const dropBox =
                        target
                            ? target.closest(".car-cell-box")
                            : null;

                    document.querySelectorAll(".car-cell-box")
                        .forEach(td => {

                            td.classList.remove("drag-over");

                        });

                    if (!dropBox) {

                        touchDragBooking = null;
                        return;

                    }

                    pendingTargetTime =
                        dropBox.dataset.time;

                    pendingTargetCar =
                        dropBox.dataset.car;

                    // SAME SLOT
                    if (
                        touchDragBooking.time === pendingTargetTime
                        &&
                        touchDragBooking.car === pendingTargetCar
                    ) {

                        touchDragBooking = null;
                        return;

                    }

                    dragBooking = touchDragBooking;

                    const ok = confirm(
                        `${dragBooking.room}を${pendingTargetTime}へ移動しますか？`
                    );

                    if (ok) {

                        executePendingAction("move");

                    }

                    touchDragBooking = null;

                }, { passive: false });

            }
            // =========================
            // SINGLE / DOUBLE CLICK
            // =========================

            let clickTimer = null;

            line.addEventListener("click", (e) => {

                if (
                    e.target.classList.contains(
                        "quick-del-btn"
                    )
                ) return;

                // DOUBLE CLICK
                if (clickTimer) {

                    clearTimeout(clickTimer);

                    clickTimer = null;

                    toggleDoneStatus(item);

                }

                // SINGLE CLICK
                else {

                    clickTimer = setTimeout(() => {

                        openEditPopup(item);

                        clickTimer = null;

                    }, 250);

                }

            });

            // =========================
            // OPEN EDIT
            // =========================

            function openEditPopup(item) {

                popup.classList.remove("hidden");

                popup.dataset.editId = item.id;

                popup.dataset.editDate =
                    item.date;

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

            }

            // =========================
            // DONE TOGGLE
            // =========================

            async function toggleDoneStatus(item) {
                const isCanceled = item.status === "canceled";
                const isMoved = item.status === "moved";
                const isDone = item.status === "done";
                if (
                    !isTodayBooking(item.date)
                ) return;

                if (isMoved) return;

                const ref = db.ref(
                    "reservations/" +
                    item.date +
                    "/" +
                    item.id
                );

                try {

                    // done -> normal
                    if (isDone) {

                        await ref.child(
                            "status"
                        ).remove();

                    }

                    // canceled -> normal
                    else if (isCanceled) {

                        await ref.child(
                            "status"
                        ).remove();

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

            }
            // =========================
            // APPEND
            // =========================

            line.appendChild(mainContentBlock);

            line.appendChild(rightActionsBlock);

            guestRow.appendChild(line);


        });

    });
    applySearchFilter();
}

// ── DRAG & DROP LIÊN TRANG ──
document.querySelectorAll(".car-cell-box").forEach(td => {
    td.addEventListener("dragover", (e) => { e.preventDefault(); td.classList.add("drag-over"); });
    td.addEventListener("dragleave", () => td.classList.remove("drag-over"));
    td.addEventListener("drop", (e) => {
        e.preventDefault();
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

        executePendingAction("move");
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

function isTodayTimestamp(timestamp) {
    if (!timestamp) return false;

    const createdDate = new Date(Number(timestamp));
    if (Number.isNaN(createdDate.getTime())) return false;

    return getDateString(createdDate) === getTodayString();
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

                        if (item.archived) return;

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

document
    .querySelectorAll(".exportExcelBtn")
    .forEach(btn => {

        btn.addEventListener(
            "click",
            exportExcel
        );

    });

async function exportExcel() {
    try {
        const date = adminDate.value;

        const response = await fetch("./bus_booking1.xlsx");
        const arrayBuffer = await response.arrayBuffer();

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

        const sheetEarly = workbook.getWorksheet("6-7");
        const sheetLate = workbook.getWorksheet("7-10");

        // =========================
        // DATE HEADER
        // =========================
        const weekList = ["日", "月", "火", "水", "木", "金", "土"];

        const dateObj = new Date(date);
        const week = weekList[dateObj.getDay()];
        const [year, month, day] = date.split("-");

        const headerText = `${Number(month)}月 ${Number(day)}日（${week}）`;
        sheetEarly.getCell("D1").value = headerText;
        sheetLate.getCell("D1").value = headerText;

        // =========================
        // LOAD DATA
        // =========================
        const snapshot = await db.ref("reservations/" + date).get();
        const data = snapshot.val();

        if (!data) {
            alert("データなし");
            return;
        }

        // =========================
        // CLEAN TARGET CELLS (IMPORTANT)
        // =========================
        const earlyMap = {
            "06:05_ラッキータクシー": "C5",
            "06:05_ホテル": "D5",

            "06:20_ラッキータクシー": "C15",
            "06:20_ホテル": "D15",

            "06:40_ラッキータクシー": "C25",
            "06:40_ホテル": "D25",

            "07:00_ラッキータクシー": "C35",
            "07:00_ホテル": "D35"
        };
        const lateMap = {
            "07:30_ホテル": "B3",
            "08:00_ホテル": "B14",
            "08:30_ホテル": "B25",

            "09:00_ホテル": "D3",
            "09:30_ホテル": "D14",
            "10:00_ホテル": "D25"
        };

        Object.values(earlyMap).forEach(addr => {
            sheetEarly.getCell(addr).value = "";
        });

        Object.values(lateMap).forEach(addr => {
            sheetLate.getCell(addr).value = "";
        });

        // =========================
        // GROUP BOOKINGS BY SLOT
        // =========================
        const grouped = {};

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

            const text =
                `${item.room || ""}｜${item.name || ""}｜${item.adults || 0}名 ${luggage}${stay}`.trim();

            grouped[key].push(text);
        });

        // =========================
        // WRITE TO EXCEL (1 booking = 1 row)
        // =========================
        Object.entries(grouped).forEach(([key, list]) => {

            let sheet = null;
            let baseCell = null;

            if (earlyMap[key]) {
                sheet = sheetEarly;
                baseCell = earlyMap[key];
            }
            else if (lateMap[key]) {
                sheet = sheetLate;
                baseCell = lateMap[key];
            }

            if (!sheet || !baseCell) return;

            const col = baseCell.replace(/[0-9]/g, "");
            const baseRow = parseInt(baseCell.replace(/\D/g, ""));

            list.forEach((text, i) => {

                const row = baseRow + i;

                sheet.getCell(`${col}${row}`).value = text;

            });

        });

        // =========================
        // EXPORT FILE
        // =========================
        const buffer = await workbook.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer]),
            `bus_${date}.xlsx`
        );

    } catch (error) {
        console.error(error);
        alert("Excel出力エラー");
    }
}

document
    .querySelectorAll(".showAllBookingsBtn")
    .forEach(btn => {

        btn.addEventListener(
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

                !item.archived
                &&
                item.status !== "canceled"
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

    });
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
loadReservations();
