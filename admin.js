// FIREBASE CONFIG

const firebaseConfig = {

  apiKey: "AIzaSyDppkqjWkRyL_JYFrHF7MWvTFAACwgxU-c",

  authDomain: "bus-boking-283a9.firebaseapp.com",

  databaseURL:
  "https://bus-boking-283a9-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "bus-boking-283a9",

  storageBucket:
  "bus-boking-283a9.firebasestorage.app",

  messagingSenderId:
  "536319278949",

  appId:
  "1:536319278949:web:3bf4ce8021e2b326086b8c"

};


// START FIREBASE

firebase.initializeApp(firebaseConfig);

const db =
firebase.database();


// HTML

const reserveBtns =
document.querySelectorAll(".reserve-btn");

const popup =
document.getElementById("reservePopup");

const popupTime =
document.getElementById("popupTime");

const closePopup =
document.getElementById("closePopup");

const deleteBtn =
document.getElementById("deleteBtn");

const reserveForm =
document.getElementById("reserveForm");


// OPEN POPUP

reserveBtns.forEach(btn => {

  btn.addEventListener("click", () => {

    const time =
    btn.dataset.time;

    const car =
    btn.dataset.car;

    popup.dataset.time =
    time;

    popup.dataset.car =
    car;

    popup.dataset.editId =
    "";

    popupTime.innerText =
    `${time}　${car}`;

    popup.classList.remove("hidden");

    reserveForm.reset();

  });

});


// CLOSE POPUP

closePopup.addEventListener("click", () => {

  popup.classList.add("hidden");

});


// SAVE

reserveForm.addEventListener("submit", (e) => {

  e.preventDefault();

  const inputs =
  reserveForm.querySelectorAll("input");

  const selects =
  reserveForm.querySelectorAll("select");

  const data = {

    date:
    document.getElementById("adminDate").value,

    time:
    popup.dataset.time,

    car:
    popup.dataset.car,

    room:
    inputs[0].value,

    name:
    inputs[1].value,

    phone:
    inputs[2].value,

    adults:
    Number(selects[0].value),

    lapChild:
    Number(selects[1].value),

    large:
    Number(selects[2].value),

    medium:
    Number(selects[3].value),

    stroller:
    Number(selects[4].value),

    createdAt:
    Date.now()

  };

  const editId =
  popup.dataset.editId;

  // EDIT

  if(editId){

    db.ref(
      "reservations/" + editId
    ).set(data);

  }

  // NEW

  else{

    db.ref("reservations")
    .push(data);

  }

  popup.classList.add("hidden");

  reserveForm.reset();

  popup.dataset.editId = "";

});


// LOAD RESERVATIONS

function loadReservations(){

  db.ref("reservations")
  .on("value", (snapshot) => {

    const data =
    snapshot.val();

    // CLEAR ALL

    document
    .querySelectorAll(".guest-row")
    .forEach(row => {

      row.innerHTML = "";

    });

    // SHOW EMPTY

    document
    .querySelectorAll(".empty-text")
    .forEach(el => {

      el.style.display = "block";

    });

    if(!data){

      return;

    }

    Object.entries(data)
    .forEach(([id, item]) => {

      item.id = id;

      const btn =
      document.querySelector(

        `.reserve-btn[data-time="${item.time}"][data-car="${item.car}"]`

      );

      if(!btn){

        return;

      }

      const td =
      btn.closest("td");

      let guestRow =
      td.querySelector(".guest-row");

      // CREATE guest-row IF NONE

      if(!guestRow){

        guestRow =
        document.createElement("div");

        guestRow.className =
        "guest-row";

        td.prepend(guestRow);

      }

      // LUGGAGE

      let luggage = "";

      if(item.large > 0){

        luggage += `(大${item.large})`;

      }

      if(item.medium > 0){

        luggage += `(中${item.medium})`;

      }

      if(item.stroller > 0){

        luggage += `(ベビ${item.stroller})`;

      }

      // TOTAL PEOPLE

      const total =
      Number(item.adults)
      +
      Number(item.lapChild);

      // LINE

      const line =
      document.createElement("div");

      line.className =
      "guest-line";

      line.innerText =
      `${item.room || ""}　${item.name || ""}　${total}名 ${luggage}`;

      // EDIT CLICK

      line.addEventListener("click", () => {

        popup.classList.remove("hidden");

        popup.dataset.editId =
        item.id;

        popup.dataset.time =
        item.time;

        popup.dataset.car =
        item.car;

        popupTime.innerText =
        `${item.time}　${item.car}`;

        const inputs =
        reserveForm.querySelectorAll("input");

        const selects =
        reserveForm.querySelectorAll("select");

        inputs[0].value =
        item.room || "";

        inputs[1].value =
        item.name || "";

        inputs[2].value =
        item.phone || "";

        selects[0].value =
        item.adults || 0;

        selects[1].value =
        item.lapChild || 0;

        selects[2].value =
        item.large || 0;

        selects[3].value =
        item.medium || 0;

        selects[4].value =
        item.stroller || 0;

      });

      guestRow.appendChild(line);

      // HIDE EMPTY

      const empty =
      td.querySelector(".empty-text");

      if(empty){

        empty.style.display =
        "none";

      }

    });

  });

}


// DELETE

deleteBtn.addEventListener("click", () => {

  const editId =
  popup.dataset.editId;

  if(!editId){

    return;

  }

  const ok =
  confirm("予約を削除しますか？");

  if(!ok){

    return;

  }

  db.ref(
    "reservations/" + editId
  ).remove();

  popup.classList.add("hidden");

  reserveForm.reset();

  popup.dataset.editId = "";

});


// START LOAD

loadReservations();