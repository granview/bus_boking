// =========================
// FIREBASE
// =========================
let editingMode = false;
const resultPopup =
document.getElementById("resultPopup");

const resultContent =
document.getElementById("resultContent");

const openEditBtn =
document.getElementById("openEditBtn");

const cancelBookingBtn =
document.getElementById("cancelBookingBtn");

const closeResultPopup =
document.getElementById("closeResultPopup");

let currentBooking = null;
let currentBookingId = null;
let currentBookingDate = null;
function resetBookingState(){

  currentBooking = null;

  currentBookingId = null;

  currentBookingDate = null;


  bookingForm.reset();

  manageForm.reset();

}
const firebaseConfig = {

  apiKey: "AIzaSyDppkqjWkRyL_JYFrHF7MWvTFAACwgxU-c",

  authDomain:
  "bus-boking-283a9.firebaseapp.com",

  databaseURL:
  "https://bus-boking-283a9-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId:
  "bus-boking-283a9",

  storageBucket:
  "bus-boking-283a9.firebasestorage.app",

  messagingSenderId:
  "536319278949",

  appId:
  "1:536319278949:web:3bf4ce8021e2b326086b8c"

};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();


// =========================
// TIME SLOT
// =========================

const earlySlots = [
  "06:05",
  "06:20",
  "06:40",
  "07:00"
];

const regularSlots = [
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00"
];
function getMaxPeopleByLuggage(
  time,
  totalLuggagePoint
){

  // =========================
  // SHUTTLE 7名
  // =========================

  if(time >= "07:30"){

    // ít hành lý
    if(totalLuggagePoint <= 7){
	
      return 7;

    }

    // hơi nhiều
    if(totalLuggagePoint <= 8){

      return 6;

    }

    // nhiều
    if(totalLuggagePoint <= 10){

      return 5;

    }

    // rất nhiều
    if(totalLuggagePoint <= 12){

      return 4;

    }

    // quá tải
    return 0;

  }

  // =========================
  // EARLY 8名 / 7名
  // =========================

  else{

    // ít hành lý
    if(totalLuggagePoint <= 8){

      return 8;

    }

    // hơi nhiều
    if(totalLuggagePoint <= 10){

      return 7;

    }

    // nhiều
    if(totalLuggagePoint <= 14){

      return 6;

    }

    // rất nhiều
    if(totalLuggagePoint <= 18){

      return 5;

    }

    // quá tải
    return 0;

  }

}// =========================
// HTML
// =========================

const earlyContainer =
document.getElementById("earlySlots");

const regularContainer =
document.getElementById("regularSlots");

const popup =
document.getElementById("popup");

const selectedTime =
document.getElementById("selectedTime");

const closePopup =
document.getElementById("closePopup");

const bookingForm =
document.getElementById("bookingForm");

const manageBookingBtn =
document.getElementById("manageBookingBtn");

const managePopup =
document.getElementById("managePopup");

const closeManagePopup =
document.getElementById("closeManagePopup");

const manageForm =
document.getElementById("manageForm");

const busDate =
document.getElementById("busDate");
const confirmPopup =
document.getElementById("confirmPopup");

const confirmContent =
document.getElementById("confirmContent");

const finalConfirmBtn =
document.getElementById("finalConfirmBtn");

const backEditBtn =
document.getElementById("backEditBtn");


// =========================
// DEFAULT DATE = TOMORROW
// =========================

const tomorrow = new Date();

tomorrow.setDate(
  tomorrow.getDate() + 1
);

busDate.value =
tomorrow.toISOString().split("T")[0];


// =========================
// REALTIME REF
// =========================

let currentRef = null;
let pendingBookingData = null;


// =========================
// CREATE CARD
// =========================

function createFirebaseCard(
  time,
  remain,
  booked,
  maxSeats
){

  const card =
  document.createElement("div");

  card.classList.add("slot-card");

  if(remain <= 0){

    card.classList.add("full");

  }

  else if(remain <= 2){

    card.classList.add("warning");

  }

  card.innerHTML = `

    <h3>${time}</h3>

    <p>

      ${
        remain <= 0
        ? `満席 (${booked}/${maxSeats}名)`
        : `残り ${remain}席`
      }

    </p>

    <button ${remain <= 0 ? "disabled" : ""}>
  予約
</button>

  `;

 const reserveBtn =
card.querySelector("button");

if(remain <= 0){

  reserveBtn.disabled = true;

}
else{

  reserveBtn.addEventListener("click",()=>{

    if(!editingMode){

  resetBookingState();

}

    selectedTime.innerText =
    time;

    popup.dataset.time =
    time;

    popup.classList.remove("hidden");
if(editingMode && currentBooking){

  const inputs =
  bookingForm.querySelectorAll("input");

  const selects =
  bookingForm.querySelectorAll("select");

  inputs[0].value =
  currentBooking.name || "";

  inputs[1].value =
  currentBooking.room || "";

  inputs[2].value =
  currentBooking.checkin || "";

  inputs[3].value =
  currentBooking.phone || "";

  selects[0].value =
  currentBooking.adults || 1;

  selects[1].value =
  currentBooking.childSeat || 0;

  selects[2].value =
  currentBooking.lapChild || 0;

  selects[3].value =
  currentBooking.large || 0;

  selects[4].value =
currentBooking.medium || 0;

  selects[5].value =
  currentBooking.stroller || 0;

}

  });

}

  
  return card;

}


// =========================
// RENDER SLOT
// =========================

function renderSlots(){

  const selectedDate =
  busDate.value;

  // REMOVE OLD LISTENER

  if(currentRef){

    currentRef.off();

  }

  currentRef =
  db.ref(
    "reservations/" + selectedDate
  );

  currentRef.on("value",(snapshot)=>{

    const data =
    snapshot.val();

    const usedMap = {};

// CALCULATE USED SEAT

if(data){

  Object.values(data)
  .forEach(item=>{

    const key =
    item.time + "_" + item.car;

    if(!usedMap[key]){

      usedMap[key] = 0;

    }

    usedMap[key] +=
    Number(item.adults || 0);

  });

}

    // CLEAR

    earlyContainer.innerHTML = "";

    regularContainer.innerHTML = "";

    // EARLY

   earlySlots.forEach(time=>{

  const booked8 =
  usedMap[time + "_8名車"] || 0;

  const booked7 =
  usedMap[time + "_7名車"] || 0;

  let remain = 0;

  // ưu tiên xe 8

  if(booked8 < 8){

    remain = 8 - booked8;

  }

  // xe 8 đầy mới tính xe 7

  else{

    remain = 7 - booked7;

  }

  earlyContainer.appendChild(

    createFirebaseCard(
      time,
      remain,
      booked8 + booked7,
      booked8 < 8 ? 8 : 7
    )

  );

});
    // REGULAR

    regularSlots.forEach(time=>{

      const booked =
usedMap[time + "_Shuttle"] || 0;

      const remain =
      7 - booked;

      regularContainer.appendChild(

        createFirebaseCard(
          time,
          remain,
          booked,
          7
        )

      );

    });

  });

}


// =========================
// CLOSE POPUP
// =========================

closePopup.addEventListener("click",()=>{
editingMode = false;

  resetBookingState();

　


  popup.classList.add("hidden");

});



// =========================
// SAVE BOOKING
// =========================

// =========================
// SAVE BOOKING
// =========================

bookingForm.addEventListener("submit",(e)=>{

  e.preventDefault();

  const inputs =
  bookingForm.querySelectorAll("input");

  const selects =
  bookingForm.querySelectorAll("select");
const shuttleDate =
busDate.value;

const checkinDate =
inputs[2].value;

if(
  shuttleDate <= checkinDate
){

  alert(
    "バス利用日はチェックイン日より後の日付を選択してください"
  );

  return;

}

  const adults =
  Number(selects[0].value);
  const luggagePoint =

(Number(selects[3].value) * 2)
+
(Number(selects[4].value) * 1)
+
(Number(selects[5].value) * 2.5);
   const maxSeats =
popup.dataset.time <= "07:00"
? 8
: 7;

  db.ref(
  "reservations/" + busDate.value
)
  .once("value")
  .then(snapshot=>{

    const firebaseData = snapshot.val();

    let used8 = 0;
let used7 = 0;
let usedShuttle = 0;
let luggage8 = 0;
let luggage7 = 0;
let luggageShuttle = 0;

Object.entries(firebaseData || {})
.forEach(([id,item])=>{
  const point =

(Number(item.large || 0) * 2)
+
(Number(item.medium || 0) * 1)
+
(Number(item.stroller || 0) * 2.5);

  if(id === currentBookingId){

    return;

  }

  if(item.time !== popup.dataset.time){

    return;

  }

  if(item.car === "8名車"){

    used8 += Number(item.adults || 0);
luggage8 += point;

  }

  else if(item.car === "7名車"){

    used7 += Number(item.adults || 0);
luggage7 += point;

  }

  else if(item.car === "Shuttle"){

    usedShuttle += Number(item.adults || 0);
luggageShuttle += point;

  }

});

const maxPeopleByLuggage =
getMaxPeopleByLuggage(
  popup.dataset.time,
  luggagePoint
);

let carType = "";
let remain = 0;
// ======================
// EARLY TIME
// ======================

if(popup.dataset.time <= "07:00"){

  // luggage after adding booking

  const totalLuggage8 =
  luggage8 + luggagePoint;

  const totalLuggage7 =
  luggage7 + luggagePoint;

  // max people by luggage

  const maxSeat8 =
  getMaxPeopleByLuggage(
    popup.dataset.time,
    totalLuggage8
  );

  const maxSeat7 =
  getMaxPeopleByLuggage(
    popup.dataset.time,
    totalLuggage7
  );

  // ======================
  // ưu tiên xe 8
  // ======================

  if(

    used8 + adults <= 8
    &&
    used8 + adults <= maxSeat8

  ){

    carType = "8名車";

    remain =
    8 - used8;

  }

  // ======================
  // dùng xe 7
  // ======================

  else if(

    used7 + adults <= 7
    &&
    used7 + adults <= maxSeat7

  ){

    carType = "7名車";

    remain =
    7 - used7;

  }

  else{

    alert("満席です");

    return;

  }

}
// ======================
// REGULAR SHUTTLE
// ======================

else{

  const totalLuggageShuttle =
luggageShuttle + luggagePoint;

const maxSeatShuttle =
getMaxPeopleByLuggage(
  popup.dataset.time,
  totalLuggageShuttle
);

if(
  usedShuttle + adults >
  maxSeatShuttle
){

    alert(
      `荷物が多いため,フロントまでです`
    );

    return;

  }

  if(
    usedShuttle + adults <= 7
  ){

    carType = "Shuttle";

    remain =
    7 - usedShuttle;

  }

  else{

    alert("満席です");

    return;

  }

}

    const data = {

      date:
      busDate.value,

      time:
      popup.dataset.time,

      car:
      carType,

bookingSource: "guest",

      name:
      inputs[0].value,

      room:
      inputs[1].value,

      checkin:
      inputs[2].value,

      phone:
      inputs[3].value,

      adults:
      Number(selects[0].value),

      childSeat:
      Number(selects[1].value),

      lapChild:
      Number(selects[2].value),

      large:
      Number(selects[3].value),

      medium:
      Number(selects[4].value),

      stroller:
      Number(selects[5].value),

      createdAt:
      Date.now()

    };

    pendingBookingData = data;

confirmContent.innerHTML = `

  <div>お名前：${data.name}</div>
  <div>電話番号：${data.phone}</div>
  <div>チェックイン：${data.checkin}</div>
  <div>ご利用日：${data.date}</div>
  <div>時間：${data.time}</div>
  <div>人数：${data.adults}名</div>
  <div>車両：${data.car}</div>

`;

popup.classList.add("hidden");

confirmPopup.classList.remove("hidden");

  });

});

// =========================
// MANAGE POPUP
// =========================

manageBookingBtn.addEventListener("click",()=>{
  manageForm.reset();

  managePopup.classList.remove("hidden");

});

closeManagePopup.addEventListener("click",()=>{
   manageForm.reset();

  managePopup.classList.add("hidden");

});


// =========================
// SEARCH
// =========================

manageForm.addEventListener("submit",(e)=>{

  e.preventDefault();

  const inputs =
  manageForm.querySelectorAll("input");

  const name =
  inputs[0].value.trim();

  const phone =
  inputs[1].value.trim();

  const checkin =
  inputs[2].value;

  db.ref("reservations")
  .once("value")
  .then(snapshot=>{

    const allData =
    snapshot.val();

    currentBooking = null;

    Object.entries(allData || {})
    .forEach(([date, bookings])=>{

      if(!bookings){

  return;

}

Object.entries(bookings)
.forEach(([id, item])=>{

        if(

          item.name === name
          &&
          item.phone === phone
          &&
          item.checkin === checkin

        ){

          currentBooking = item;

          currentBookingId = id;

          currentBookingDate = date;

        }

      });

    });

    if(!currentBooking){

      alert("予約が見つかりません");

      return;

    }

    managePopup.classList.add("hidden");

    resultPopup.classList.remove("hidden");

    resultContent.innerHTML = `

<div>
  お名前：
  ${currentBooking.name}
</div>

<div>
  電話番号：
  ${currentBooking.phone}
</div>

<div>
  チェックイン：
  ${currentBooking.checkin}
</div>

<div>
  バス予約日：
  ${currentBooking.date}
</div>

<div>
  時間：
  ${currentBooking.time}
</div>

<div>
  人数：
  ${currentBooking.adults}名
</div>

`;

  });

});
closeResultPopup.addEventListener("click",()=>{

   resetBookingState();
  resultPopup.classList.add("hidden");

});
openEditBtn.addEventListener("click",()=>{

  resultPopup.classList.add("hidden");

  editingMode = true;

  alert("変更したい時間を選択してください");

});cancelBookingBtn.addEventListener("click",()=>{

  const ok =
  確認("予約をキャンセルしますか？");

  if(!ok){

    return;

  }

  db.ref(

    "reservations/" +
    currentBookingDate +
    "/" +
    currentBookingId

  ).remove();

  alert("キャンセル完了");

  resultPopup.classList.add("hidden");

});

// =========================
// DATE CHANGE
// =========================

busDate.addEventListener("change",()=>{

  renderSlots();

});


// =========================
// START
// =========================

renderSlots();
backEditBtn.addEventListener("click",()=>{

  confirmPopup.classList.add("hidden");

  popup.classList.remove("hidden");

});
finalConfirmBtn.addEventListener("click",()=>{

  const data = pendingBookingData;

  if(!data){

    return;

  }

  // EDIT

  if(currentBookingId){

    if(currentBookingDate === data.date){

      db.ref(

        "reservations/" +
        currentBookingDate +
        "/" +
        currentBookingId

      ).update(data);

    }

    else{

      db.ref(
        "reservations/" +
        data.date
      )
      .push(data)
      .then(()=>{

        return db.ref(

          "reservations/" +
          currentBookingDate +
          "/" +
          currentBookingId

        ).remove();

      });

    }

    alert("予約修正完了");

  }

  // NEW BOOKING

  else{

    db.ref(
      "reservations/" +
      data.date
    ).push(data);

    alert("予約完了、5分前にロビーでお待ちください");

  }

  pendingBookingData = null;

  resetBookingState();

  confirmPopup.classList.add("hidden");

});