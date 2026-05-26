// ==========================================
// COMPLETE DRAG + TOUCH + DONE SYSTEM
// ==========================================

let longPressTimer = null;
let clickTimer = null;

let touchMoved = false;
let longPressTriggered = false;

if (!isCanceled && !isMoved) {

    line.draggable = true;

    // =====================================
    // PC DRAG START
    // =====================================

    line.addEventListener("dragstart", () => {

        dragBooking = item;

        line.classList.add("dragging");

    });

    // =====================================
    // PC DRAG END
    // =====================================

    line.addEventListener("dragend", () => {

        line.classList.remove("dragging");

        dragBooking = null;

    });

    // =====================================
    // TOUCH START
    // =====================================

    line.addEventListener("touchstart", (e) => {

        if (
            e.target.classList.contains("quick-del-btn")
        ) return;

        touchMoved = false;
        longPressTriggered = false;

        dragBooking = item;

        activeTouchElement = line;

        // =========================
        // LONG PRESS TIMER
        // =========================

        longPressTimer = setTimeout(async () => {

            if (touchMoved) return;

            longPressTriggered = true;

            const ref = db.ref(
                "reservations/" +
                item.date +
                "/" +
                item.id
            );

            try {

                if (isDone) {

                    await ref.child("status").remove();

                } else {

                    await ref.update({
                        status: "done"
                    });

                }

            } catch (err) {

                console.error(err);

            }

        }, 700);

        // =========================
        // CREATE DRAG CLONE
        // =========================

        touchClone = line.cloneNode(true);

        touchClone.style.position = "fixed";

        touchClone.style.left = "0";
        touchClone.style.top = "0";

        touchClone.style.width =
            line.offsetWidth + "px";

        touchClone.style.opacity = "0.85";

        touchClone.style.pointerEvents = "none";

        touchClone.style.zIndex = "99999";

        document.body.appendChild(touchClone);

    }, { passive: true });

    // =====================================
    // TOUCH MOVE
    // =====================================

    line.addEventListener("touchmove", (e) => {

        touchMoved = true;

        clearTimeout(longPressTimer);

        if (!touchClone) return;

        const touch = e.touches[0];

        touchClone.style.transform =
            `translate(
                ${touch.clientX - touchClone.offsetWidth / 2}px,
                ${touch.clientY - touchClone.offsetHeight / 2}px
            )`;

        const elementOver =
            document.elementFromPoint(
                touch.clientX,
                touch.clientY
            );

        document
            .querySelectorAll(".car-cell-box")
            .forEach(c =>
                c.classList.remove("drag-over")
            );

        const targetCell =
            elementOver?.closest(".car-cell-box");

        if (targetCell) {

            targetCell.classList.add("drag-over");

        }

    }, { passive: true });

    // =====================================
    // TOUCH END
    // =====================================

    line.addEventListener("touchend", async (e) => {

        clearTimeout(longPressTimer);

        // =========================
        // LONG PRESS DONE
        // =========================

        if (longPressTriggered) {

            if (touchClone) {

                touchClone.remove();
                touchClone = null;

            }

            dragBooking = null;

            return;

        }

        // =========================
        // REMOVE CLONE
        // =========================

        if (touchClone) {

            touchClone.remove();
            touchClone = null;

        }

        document
            .querySelectorAll(".car-cell-box")
            .forEach(c =>
                c.classList.remove("drag-over")
            );

        const touch = e.changedTouches[0];

        const elementOver =
            document.elementFromPoint(
                touch.clientX,
                touch.clientY
            );

        const targetCell =
            elementOver?.closest(".car-cell-box");

        // =================================
        // MOVE BOOKING
        // =================================

        if (
            targetCell &&
            (
                dragBooking.time !==
                targetCell.dataset.time ||

                dragBooking.car !==
                targetCell.dataset.car
            )
        ) {

            pendingTargetTime =
                targetCell.dataset.time;

            pendingTargetCar =
                targetCell.dataset.car;

            const ok = confirm(
`${dragBooking.room}
を
${pendingTargetTime}
へ移動しますか？`
            );

            if (ok) {

                pendingActionType = "move";

                // HIỆN PASSWORD NGAY
                passwordPopup.classList.remove(
                    "hidden"
                );

                pwdInput.value = "";

                setTimeout(() => {

                    pwdInput.focus();

                }, 50);

            } else {

                dragBooking = null;

            }

        }

        activeTouchElement = null;

    });

}

// =====================================
// SINGLE CLICK = OPEN EDIT FORM
// =====================================

line.addEventListener("click", (e) => {

    if (
        e.target.classList.contains("quick-del-btn")
    ) return;

    if (touchMoved) return;

    clearTimeout(clickTimer);

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

        stayActive = item.stay || false;

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

    }, 220);

});

// =====================================
// DOUBLE CLICK PC = DONE
// =====================================

line.addEventListener("dblclick", async () => {

    clearTimeout(clickTimer);

    const ref = db.ref(
        "reservations/" +
        item.date +
        "/" +
        item.id
    );

    try {

        if (isDone) {

            await ref.child("status").remove();

        } else {

            await ref.update({
                status: "done"
            });

        }

    } catch (err) {

        console.error(err);

    }

});