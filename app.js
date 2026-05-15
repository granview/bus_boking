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

const bookings = {
  "06:05": 6,
  "06:20": 15,
  "06:40": 8,
  "07:00": 5,

  "07:30": 4,
  "08:00": 7,
  "08:30": 3,
  "09:00": 6,
  "09:30": 1,
  "10:00": 7
};

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

function createCard(time,maxSeats){

  const booked = bookings[time] || 0;

  const remain = maxSeats - booked;

  const card = document.createElement("div");

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
      ${remain <= 0
        ? "満席"
        : `残り ${remain}席`
      }
    </p>

    <button ${remain <= 0 ? "disabled" : ""}>
      Reserve
    </button>

  `;

  if(remain > 0){

    card
    .querySelector("button")
    .addEventListener("click",()=>{

      selectedTime.innerText = time;

      popup.classList.remove("hidden");

    });

  }

  return card;

}

function renderSlots(){

  earlyContainer.innerHTML = "";
  regularContainer.innerHTML = "";

  earlySlots.forEach(time=>{

    earlyContainer.appendChild(
      createCard(time,15)
    );

  });

  regularSlots.forEach(time=>{

    regularContainer.appendChild(
      createCard(time,7)
    );

  });

}

closePopup.addEventListener("click",()=>{

  popup.classList.add("hidden");

});

bookingForm.addEventListener("submit",(e)=>{

  e.preventDefault();

  alert("Reservation Completed");

  bookingForm.reset();

  popup.classList.add("hidden");

});

manageBookingBtn.addEventListener("click",()=>{

  managePopup.classList.remove("hidden");

});

closeManagePopup.addEventListener("click",()=>{

  managePopup.classList.add("hidden");

});

manageForm.addEventListener("submit",(e)=>{

  e.preventDefault();

  alert("Reservation Search");

});

renderSlots();