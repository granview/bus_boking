// ========================================
// FIREBASE
// ========================================

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


// ========================================
// HTML
// ========================================

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

const searchDate =
document.getElementById("searchDate");

const searchRoom =
document.getElementById("searchRoom");

const searchName =
document.getElementById("searchName");

const searchBtn =
document.getElementById("searchBtn");

const clearSearchBtn =
document.getElementById("clearSearchBtn");

const searchResult =
document.getElementById("searchResult");


// ========================================
// DEFAULT DATE
// ========================================

const tomorrow = new Date();

tomorrow.setDate(
  tomorrow.getDate() + 1
);

adminDate.value =
tomorrow.toISOString()
.split("T")[0];

searchDate.value =
adminDate.value;


// ========================================
// GLOBAL
// ========================================

let currentReservationRef = null;

let dragBooking = null;


// ========================================
// SEAT MAP
// ========================================

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


// ========================================
// LUGGAGE POINT
// ========================================

function getLuggagePoint(item){

  return (

    Number(item.large || 0) * 2

    +

    Number(item.medium || 0) * 1

    +

    Number(item.stroller || 0) * 2.5

  );

}


// ========================================
// MAX PEOPLE BY LUGGAGE
// ========================================

function getMaxPeopleByLuggage(
  time,
  totalLuggagePoint
){

  if(time >= "07:30"){

    if(totalLuggagePoint <= 4){

      return 7;

    }

    if(totalLuggagePoint <= 8){

      return 6;

    }

    if(totalLuggagePoint <= 10){

      return 5;

    }

    if(totalLuggagePoint <= 12){

      return 4;

    }

    return 0;

  }

  else{

    if(totalLuggagePoint <= 6){

      return 8;

    }

    if(totalLuggagePoint <= 8){

      return 7;

    }

    if(totalLuggagePoint <= 14){

      return 6;

    }

    return 0;

  }

}


// ========================================
// OPEN POPUP
// ========================================

reserveBtns.forEach(btn => {

  btn.addEventListener("click",()=>{

    popup.classList.remove("hidden");

    popup.dataset.time =
    btn.dataset.time;

    popup.dataset.car =
    btn.dataset.car;

    popup.dataset.editId = "";

    popup.dataset.editDate = "";

    popupTime.innerText =
`${btn.dataset.time}　${btn.dataset.car}`;

    reserveForm.reset();

    stayCheck.checked = false;

    luggageSelects.forEach(select=>{

      select.disabled = false;

    });

  });

});


// ========================================
// CLOSE POPUP
// ========================================

closePopup.addEventListener("click",()=>{

  popup.classList.add("hidden");

});


// ========================================
// SAVE
// ========================================

reserveForm.addEventListener("submit",(e)=>{

  e.preventDefault();

  const inputs =
  reserveForm.querySelectorAll("input");

  const selects =
  reserveForm.querySelectorAll("select");

  const adults =
  Number(selects[0].value);

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
    Date.now(),

    status:
    "active"

  };

  const editId =
  popup.dataset.editId;

  if(editId){

    db.ref(

      "reservations/" +
      popup.dataset.editDate +
      "/" +
      editId

    ).set(data);

  }

  else{

    db.ref(
      "reservations/" + data.date
    ).push(data);

  }

  popup.classList.add("hidden");

  reserveForm.reset();

});


// ========================================
// LOAD RESERVATIONS
// ========================================

function loadReservations(){

  const selectedDate =
  adminDate.value;

  if(currentReservationRef){

    currentReservationRef.off();

  }

  currentReservationRef =
  db.ref(
    "reservations/" + selectedDate
  );

  currentReservationRef.on("value",(snapshot)=>{

    const data =
    snapshot.val();

    // CLEAR

    document
    .querySelectorAll(".guest-row")
    .forEach(row=>{

      row.innerHTML = "";

    });

    document
    .querySelectorAll(".empty-text")
    .forEach(el=>{

      el.innerText = "空きあり";

      el.classList.remove(
        "few-seat",
        "full-seat"
      );

    });

    const usedMap = {};
    const luggageMap = {};

    Object.entries(data || {})
    .forEach(([id,item])=>{

      // moved old khong tinh ghe

      if(
  item.status === "moved"
  ||
  item.cancelledAt
){

  return;

}
      const key =
      item.time + "_" + item.car;

      if(!usedMap[key]){

        usedMap[key] = 0;

      }

      if(!luggageMap[key]){

        luggageMap[key] = 0;

      }

      usedMap[key] +=
      Number(item.adults || 0);

      luggageMap[key] +=
      getLuggagePoint(item);

    });

    // SEAT STATUS

    Object.keys(seatMap)
    .forEach(key=>{

      const [time,car] =
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

      const maxSeat =
      seatMap[key];

      const used =
      usedMap[key] || 0;

      const luggage =
      luggageMap[key] || 0;

      const luggageLimit =
      getMaxPeopleByLuggage(
        time,
        luggage
      );

      const max =
      Math.min(
        maxSeat,
        luggageLimit
      );

      const remain =
      max - used;

      if(remain <= 0){

        emptyText.innerText =
`満席 (${used}名)`;

        emptyText.classList.add(
          "full-seat"
        );

      }

      else if(remain === 1){

        emptyText.innerText =
        "残り1席";

        emptyText.classList.add(
          "few-seat"
        );

      }

      else{

        emptyText.innerText =
`残り${remain}席`;

      }

    });

    // NO DATA

    if(!data){

      return;

    }

    // RENDER GUEST

    Object.entries(data)
    .forEach(([id,item])=>{

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

      if(!guestRow){

        guestRow =
        document.createElement("div");

        guestRow.className =
        "guest-row";

        td.prepend(guestRow);

      }

      // luggage

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

      const total =

      Number(item.adults || 0)

      +

      Number(item.lapChild || 0);

      let stayText = "";

      if(item.stay){

        stayText =
        " (ステイ)";

      }

      // move label

      // create line

const line =
document.createElement("div");
line.className =
"guest-line";

if(item.cancelledAt){

  line.classList.add("cancelled");

}



line.draggable = true;


// DONE

if(item.status === "done"){

  line.classList.add("done");

}


// MOVED OLD

if(item.status === "moved"){

  line.classList.add("moved");

}


// MOVED NEW

if(item.status === "moved-new"){

  line.classList.add("moved-new");

}


// moved old

if(item.status === "moved"){

  line.innerHTML = `

<span class="moved-old-text">

${item.room || ""}　
${item.name || ""}　
${total}名
${luggage}
${stayText}

</span>

<span class="move-arrow">

→ ${item.movedToTime}

</span>

`;

}


// normal + moved-new

else{

  line.innerText =

`${item.room || ""}　${item.name || ""}　${total}名 ${luggage}${stayText}`;

}

      // DRAG

      line.addEventListener("dragstart",()=>{

        dragBooking = item;

      });

      // CLICK

      let clickTimer = null;

      line.addEventListener("click",()=>{
 if(item.cancelledAt){

    return;

  }

        if(clickTimer){

          clearTimeout(clickTimer);

          clickTimer = null;

          const newStatus =

          item.status === "done"

          ? "active"
          : "done";

          db.ref(

            "reservations/" +
            item.date +
            "/" +
            item.id

          ).update({

            status: newStatus

          });

          return;

        }

        clickTimer = setTimeout(()=>{

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

          clickTimer = null;

        },250);

      });

      guestRow.appendChild(line);

    });

  });

}


// ========================================
// DELETE
// ========================================

deleteBtn.addEventListener("click",()=>{

  const editId =
  popup.dataset.editId;

  if(!editId){

    return;

  }

  const ok =
  confirm("削除しますか？");

  if(!ok){

    return;

  }

  // booking date

  const bookingDate =
  popup.dataset.editDate;

  // today

  const today =
  new Date()
  .toISOString()
  .split("T")[0];

  const ref = db.ref(

    "reservations/" +
    bookingDate +
    "/" +
    editId

  );

  // TODAY
  // chỉ cancelled

  if(bookingDate === today){

    ref.update({

      cancelledAt: Date.now()

    });

  }

  // OLD DATE
  // xóa thật

  else{

    ref.remove();

  }

  popup.classList.add("hidden");

});
// ========================================
// STAY CHECK
// ========================================

stayCheck.addEventListener("change",()=>{

  if(stayCheck.checked){

    luggageSelects.forEach(select=>{

      select.value = 0;

      select.disabled = true;

    });

  }

  else{

    luggageSelects.forEach(select=>{

      select.disabled = false;

    });

  }

});


// ========================================
// DRAG DROP
// ========================================

document.querySelectorAll("td")
.forEach(td=>{

  td.addEventListener("dragover",(e)=>{

    e.preventDefault();

  });

  td.addEventListener("drop",()=>{

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

    if(
      dragBooking.time === newTime
      &&
      dragBooking.car === newCar
    ){

      dragBooking = null;

      return;

    }

    // OLD

    db.ref(

      "reservations/" +
      dragBooking.date +
      "/" +
      dragBooking.id

    ).update({

      status: "moved",

      movedToTime: newTime,

      movedToCar: newCar,

      movedAt: Date.now()

    });

    // NEW

    const newData = {

      ...dragBooking,

      time: newTime,

      car: newCar,

      status: "moved-new",

      movedFromTime:
      dragBooking.time,

      movedFromCar:
      dragBooking.car,

      movedAt:
      Date.now(),

      createdAt:
      Date.now()

    };

    delete newData.id;

    db.ref(

      "reservations/" +
      dragBooking.date

    ).push(newData);

    dragBooking = null;

  });

});


// ========================================
// SEARCH
// ========================================

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

      const roomText =
      String(item.room || "")
      .toLowerCase();

      const nameText =
      String(item.name || "")
      .toLowerCase();

      if(
        room &&
        !roomText.includes(room)
      ){

        return;

      }

      if(
        name &&
        !nameText.includes(name)
      ){

        return;

      }

      found = true;

      const div =
      document.createElement("div");

      div.className =
      "search-line";

      div.innerHTML =
`
<div>${item.time}</div>
<div>${item.room}</div>
<div>${item.name}</div>
<div>${item.adults}名</div>
`;

      searchResult.appendChild(div);

    });

    if(!found){

      searchResult.innerHTML =
      "見つかりません";

    }

  });

});


// ========================================
// CLEAR SEARCH
// ========================================

clearSearchBtn.addEventListener("click",()=>{

  searchRoom.value = "";

  searchName.value = "";

  searchResult.innerHTML = "";

});


// ========================================
// DATE CHANGE
// ========================================

adminDate.addEventListener("change",()=>{

  loadReservations();

});


// ========================================
// START
// ========================================

loadReservations();