
// FIREBASE CONFIG
let dragBooking = null;

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

const stayCheck =
document.getElementById("stayCheck");

const luggageSelects =
document.querySelectorAll(".luggage-select");

const adminDate =
document.getElementById("adminDate");


const searchRoom =
document.getElementById("searchRoom");

const searchName =
document.getElementById("searchName");

const searchBtn =
document.getElementById("searchBtn");

const searchResult =
document.getElementById("searchResult");;


// REALTIME REF

let currentReservationRef = null;


// DEFAULT DATE = TOMORROW

const tomorrow =
new Date();

tomorrow.setDate(
  tomorrow.getDate() + 1
);

const yyyy =
tomorrow.getFullYear();

const mm =
String(
  tomorrow.getMonth() + 1
).padStart(2, "0");

const dd =
String(
  tomorrow.getDate()
).padStart(2, "0");

adminDate.value =
`${yyyy}-${mm}-${dd}`;
searchDate.value =
adminDate.value;


// SEAT MAP

const seatMap = {

  "06:05_8名車": 8,
  "06:05_7名車": 7,

  "06:20_8名車": 8,
  "06:20_7名車": 7,

  "06:40_8名車": 8,
  "06:40_7名車": 7,

  "07:00_8名車": 8,
  "07:00_7名車": 7,

  "07:30_Shuttle": 7,
  "08:00_Shuttle": 7,
  "08:30_Shuttle": 7,
  "09:00_Shuttle": 7,
  "09:30_Shuttle": 7,
  "10:00_Shuttle": 7

};


// OPEN POPUP

reserveBtns.forEach(btn => {

  btn.addEventListener("click", () => {

    const td =
    btn.closest("td");

    const seatText =
    td.querySelector(".empty-text");

    // FULL CHECK

   
    popup.dataset.time =
    btn.dataset.time;

    popup.dataset.car =
    btn.dataset.car;

    popup.dataset.editId =
    "";

    popup.dataset.editDate =
    "";

    popupTime.innerText =
    `${btn.dataset.time}　${btn.dataset.car}`;

    popup.classList.remove("hidden");

    reserveForm.reset();

    stayCheck.checked = false;

    luggageSelects.forEach(select => {

      select.disabled = false;

    });

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

  const adults =
  Number(selects[0].value);

  // NO PEOPLE

  if(adults <= 0){

    alert("人数を入力してください");

    return;

  }

  const data = {

    bookingSource: "staff",

    date:
    adminDate.value,

    time:
    popup.dataset.time,

    car:
    popup.dataset.car,

    stay:
    stayCheck.checked,

    room:
    inputs[0].value,

    name:
    inputs[1].value,

    phone:
    inputs[2].value,

    adults:
    adults,

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

      "reservations/" +
      popup.dataset.editDate +
      "/" +
      editId

    ).set(data);

  }

  // NEW

  else{

    db.ref(
      "reservations/" + data.date
    ).push(data);

  }

  popup.classList.add("hidden");

  reserveForm.reset();

  popup.dataset.editId = "";

});


// LOAD RESERVATIONS

function loadReservations(){

  const selectedDate =
  adminDate.value;

  // REMOVE OLD REALTIME

  if(currentReservationRef){

    currentReservationRef.off();

  }

  // NEW REALTIME REF

  currentReservationRef =
  db.ref(
    "reservations/" + selectedDate
  );

  currentReservationRef.on(
    "value",
    (snapshot) => {

      const data =
      snapshot.val();

      // CLEAR ALL GUEST

      document
      .querySelectorAll(".guest-row")
      .forEach(row => {

        row.innerHTML = "";

      });

      // RESET EMPTY TEXT

      document
      .querySelectorAll(".empty-text")
      .forEach(el => {

        el.style.display = "flex";

        el.classList.remove(
          "few-seat",
          "full-seat"
        );

        el.innerText =
        "空きあり";

      });

      // RESET BUTTON

      reserveBtns.forEach(btn => {

        btn.disabled = false;

      });

      // USED MAP

      const usedMap = {};

      // CALC USED SEAT

      if(data){

        Object.entries(data)
        .forEach(([id, item]) => {

          const key =
          item.time + "_" + item.car;

          const adults =
          Number(item.adults || 0);

          if(!usedMap[key]){

            usedMap[key] = 0;

          }

          usedMap[key] += adults;

        });

      }

      // SHOW SEAT STATUS

      Object.keys(seatMap)
      .forEach(key => {

        const [time, car] =
        key.split("_");

        const btn =
        document.querySelector(

          `.reserve-btn[data-time="${time}"][data-car="${car}"]`

        );

        if(!btn){

          return;

        }

        const td =
        btn.closest("td");

        const emptyText =
        td.querySelector(".empty-text");

        if(!emptyText){

          return;

        }

        const max =
        seatMap[key];

        const used =
        usedMap[key] || 0;

        const remain =
        max - used;

        // FULL OR OVERBOOKING

        if(remain <= 0){

  emptyText.innerText =
  `満席 (${used}名)`;

  emptyText.classList.add(
    "full-seat"
  );



}

        // ONLY 1 LEFT

        else if(remain === 1){

          emptyText.innerText =
          `残り1席`;

          emptyText.classList.add(
            "few-seat"
          );

          btn.disabled = false;

        }

        // NORMAL

        else{

          emptyText.innerText =
          `残り${remain}席`;

          btn.disabled = false;

        }

      });

      // NO DATA

      if(!data){

        return;

      }

      // SHOW RESERVATIONS

      Object.entries(data)
      .forEach(([id, item]) => {

        item.id = id;

        const btn =
        document.querySelector(

          `.reserve-btn[data-time="${item.time}"][data-car="${item.car}"]`

        );

        if(!btn){

          return;
console.log(item.car);

        }

        const td =
        btn.closest("td");

        let guestRow =
        td.querySelector(".guest-row");

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
        Number(item.adults || 0)
        +
        Number(item.lapChild || 0);

        // STAY

        let stayText = "";

        if(item.stay){

          stayText =
          " (ステイ)";

        }

        // LINE

        const line =
        document.createElement("div");

        line.className =
        "guest-line";
line.draggable = true;
line.addEventListener("dragstart", () => {

  dragBooking = item;

});

        line.innerText =
`${item.room || ""}　${item.name || ""}　${total}名 ${luggage}${stayText}`;

        // EDIT CLICK

        line.addEventListener("click", () => {

          popup.classList.remove("hidden");

          popup.dataset.editId =
          item.id;

          popup.dataset.editDate =
          item.date;

          popup.dataset.time =
          item.time;

          popup.dataset.car =
          item.car;

          popupTime.innerText =
`${item.time}　${item.car}　${
  item.bookingSource === "staff"
  ? "[スタッフ予約]"
  : "[お客様予約]"
}`;

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

          stayCheck.checked =
          item.stay || false;

          // STAY DISABLE

          if(stayCheck.checked){

            luggageSelects.forEach(select => {

              select.disabled = true;

            });

          }

          else{

            luggageSelects.forEach(select => {

              select.disabled = false;

            });

          }

        });

        guestRow.appendChild(line);

      });

    }

  );

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

    "reservations/" +
    popup.dataset.editDate +
    "/" +
    editId

  ).remove();

  popup.classList.add("hidden");

  reserveForm.reset();

  popup.dataset.editId = "";

});


// STAY CHECK

stayCheck.addEventListener("change", () => {

  if(stayCheck.checked){

    luggageSelects.forEach(select => {

      select.value = 0;

      select.disabled = true;

    });

  }

  else{

    luggageSelects.forEach(select => {

      select.disabled = false;

    });

  }

});


// DATE CHANGE

adminDate.addEventListener("change", () => {

  loadReservations();

});


// START


// DRAG TARGET

document.querySelectorAll("td")
.forEach(td => {

  td.addEventListener("dragover", (e) => {

    e.preventDefault();

  });

  td.addEventListener("drop", () => {

    if(!dragBooking){

      return;

    }

    const btn =
    td.querySelector(".reserve-btn");

    if(!btn){

      return;

    }

    const newTime =
    btn.dataset.time;

    const newCar =
    btn.dataset.car;

    // UPDATE FIREBASE

    db.ref(

      "reservations/" +
      dragBooking.date +
      "/" +
      dragBooking.id

    ).update({

      time: newTime,
      car: newCar

    });

    dragBooking = null;

  });

});
loadReservations();
searchBtn.addEventListener("click",()=>{

  const date =
  searchDate.value;

  const room =
  searchRoom.value
  .trim()
  .toLowerCase();

  const name =
  searchName.value
  .trim()
  .toLowerCase();

  db.ref(
    "reservations/" + date
  )
  .get()
  .then(snapshot=>{

    const data =
    snapshot.val();

    searchResult.innerHTML = "";

    if(!data){

      searchResult.innerHTML =
      "データなし";

      return;

    }

    let found = false;

    Object.entries(data)
.forEach(([id,item])=>{
item.id = id;

      const roomText =
      String(item.room || "")
      .toLowerCase();

      const nameText =
      String(item.name || "")
      .toLowerCase();

      // ROOM SEARCH

      if(
        room &&
        !roomText.includes(room)
      ){

        return;

      }

      // NAME SEARCH

      if(
        name &&
        !nameText.includes(name)
      ){

        return;

      }

      found = true;

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

      const div =
document.createElement("div");

div.className =
"search-line";

div.innerHTML =
`
<div class="search-date">
  ${item.date || ""}
</div>

<div class="search-time">
  ${item.time || ""}
</div>
<div class="search-room">
  ${item.room || ""}
</div>

<div class="search-name">
  ${item.name || ""}
</div>

<div class="search-people">
  ${item.adults || 0}名
</div>

<div class="search-luggage">
  ${luggage}
</div>
`;

div.addEventListener("click",()=>{

  popup.classList.remove("hidden");

  popup.dataset.editId =
  item.id || "";

  popup.dataset.editDate =
  item.date || "";

  popup.dataset.time =
  item.time || "";

  popup.dataset.car =
  item.car || "";

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

  stayCheck.checked =
  item.stay || false;

  if(stayCheck.checked){

    luggageSelects.forEach(select => {

      select.disabled = true;

    });

  }
  else{

    luggageSelects.forEach(select => {

      select.disabled = false;

    });

  }

});searchResult.appendChild(div);



    });

    if(!found){

      searchResult.innerHTML =
      "見つかりません";

    }

  });

});

const clearSearchBtn =
document.getElementById("clearSearchBtn");
clearSearchBtn.addEventListener("click",()=>{


  searchRoom.value = "";

  searchName.value = "";

  searchResult.innerHTML = "";

});