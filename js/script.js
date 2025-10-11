// File: js/script.js

// --- KONSTANTA GLOBAL ---
const STORAGE_KEY = "rizky_portfolio_messages";
const SLIDER_INTERVAL_MS = 6000;
let currentMessageIndex = 0;
let messageSliderInterval;
let messages = [];

// ----------------------------------------------------
// FUNGSI UTILITAS: Title Case
// ----------------------------------------------------

/**
 * Mengubah string menjadi format Title Case (Huruf pertama setiap kata kapital).
 */
function toTitleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ----------------------------------------------------
// I. WELCOME SPEECH & USER NAME HANDLERS (Pop-up Selalu Aktif)
// ----------------------------------------------------

/**
 * Meminta nama pengguna menggunakan SweetAlert2 dan menerapkan Title Case.
 */
function getNewUserName() {
  return Swal.fire({
    title: "Selamat Datang! 👋",
    text: "Siapa nama Anda? Kami akan menyambut Anda di halaman ini.",
    input: "text",
    inputPlaceholder: "Masukkan Nama Anda",
    showCancelButton: false,
    confirmButtonText: "Sapa Saya!",
    allowOutsideClick: false,
    inputValidator: (value) => {
      if (!value || value.trim() === "") {
        return "Anda perlu memasukkan nama!";
      }
    },
  }).then((result) => {
    const rawName = result.value ? result.value.trim() : "Pengunjung";
    const formattedName = toTitleCase(rawName);
    return formattedName;
  });
}

/**
 * Mengatur ucapan selamat datang. Pesan dibagi menjadi tag H1 dan P.
 */
async function setWelcomeSpeech() {
  // 1. Dapatkan nama pengguna (sudah Title Case)
  const userName = await getNewUserName();

  // 2. Tentukan konten untuk setiap elemen
  // Konten untuk H1 (Sapaan waktu dihapus)
  const h1Content = `Hi, ${userName}!`;

  // 3. Update elemen di HTML
  const h1Element = document.getElementById("greeting-name-h1");
  // Karena elemen p tidak diisi oleh JS lagi, kode untuk pElement dihilangkan.

  if (h1Element) {
    // Konten H1
    h1Element.textContent = h1Content;
  }
}

// ----------------------------------------------------
// II. LOCAL STORAGE & MESSAGE SLIDER HANDLERS
// ----------------------------------------------------

function loadMessages() {
  const messagesJson = localStorage.getItem(STORAGE_KEY);

  try {
    messages = messagesJson ? JSON.parse(messagesJson) : [];
  } catch (e) {
    console.error("Error parsing messages from Local Storage:", e);
    messages = [];
  }

  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return messages;
}

function saveMessages(newMessages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
  messages = newMessages;
}

// Fungsi untuk membuat elemen card pesan
function createMessageCard(msg) {
  const card = document.createElement("div");
  card.className = "message-card";

  const date = new Date(msg.timestamp);
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    timeZone: "Asia/Jakarta",
  };

  const formattedTime = date.toLocaleString("en-US", options);
  const finalTimeString = formattedTime
    .replace("GMT+7", "Western Indonesia Time")
    .replace(/, GMT\+\d+/, "");

  card.innerHTML = `
        <span class="message-card-timestamp">Current time : ${finalTimeString}</span>
        <p><strong>Nama</strong> : ${toTitleCase(msg.name)}</p>
        <p><strong>Tanggal Lahir</strong> : ${msg.birthdate}</p>
        <p><strong>Jenis Kelamin</strong> : ${msg.gender}</p>
        <p><strong>Pesan</strong> : ${msg.message}</p>
    `;
  return card;
}

// Fungsi untuk menampilkan slide tertentu
function showSlide(index) {
  const container = document.getElementById("message-slider-container");
  if (!container || messages.length === 0) {
    if (container) {
      clearInterval(messageSliderInterval);
      container.innerHTML =
        '<div class="text-gray-500 italic">Belum ada pesan yang masuk.</div>';
    }
    return;
  }

  currentMessageIndex = index % messages.length;
  let existingCards = container.querySelectorAll(".message-card");

  if (existingCards.length === 0 || existingCards.length !== messages.length) {
    container.innerHTML = "";
    messages.forEach((msg) => {
      const card = createMessageCard(msg);
      container.appendChild(card);
    });
    existingCards = container.querySelectorAll(".message-card");
  }

  existingCards.forEach((card, i) => {
    if (i === currentMessageIndex) {
      card.style.zIndex = 10;
      card.classList.remove("slide-out");
      card.classList.add("slide-in");
      card.style.opacity = 1;
    } else if (card.classList.contains("slide-in")) {
      card.style.zIndex = 5;
      card.classList.remove("slide-in");
      card.classList.add("slide-out");
      setTimeout(() => {
        card.classList.remove("slide-out");
        card.style.opacity = 0;
      }, 800);
    } else {
      card.style.opacity = 0;
      card.style.zIndex = 1;
      card.classList.remove("slide-out", "slide-in");
    }
  });
}

// Fungsi untuk memulai interval slider
function startMessageSlider() {
  loadMessages();

  clearInterval(messageSliderInterval);

  if (messages.length > 0) {
    showSlide(currentMessageIndex);

    messageSliderInterval = setInterval(() => {
      currentMessageIndex = (currentMessageIndex + 1) % messages.length;
      showSlide(currentMessageIndex);
    }, SLIDER_INTERVAL_MS);
  } else {
    const container = document.getElementById("message-slider-container");
    if (container) {
      container.innerHTML =
        '<div class="text-gray-500 italic">Belum ada pesan yang masuk.</div>';
    }
  }
}

// ----------------------------------------------------
// III. FORM SUBMISSION & VALIDATION
// ----------------------------------------------------

function validateForm(event) {
  event.preventDefault();

  const nameInput = document.getElementById("name-input");
  const birthdateInput = document.getElementById("birthdate-input");
  const messageInput = document.getElementById("message-input");
  const genderInput = document.querySelector('input[name="gender"]:checked');
  const form = document.getElementById("contact-form");

  const name = nameInput.value.trim();
  const birthdate = birthdateInput.value;
  const gender = genderInput ? genderInput.value : "";
  const message = messageInput.value.trim();

  if (!name || !birthdate || !gender || !message) {
    Swal.fire({
      icon: "error",
      title: "Ups!",
      text: "Semua kolom wajib diisi. Mohon lengkapi data Anda.",
      confirmButtonColor: "#3085d6",
    });
    return false;
  }

  const formattedBirthdate = birthdate.split("-").reverse().join("/");

  const newMessage = {
    name: name,
    birthdate: formattedBirthdate,
    gender: gender,
    message: message,
    timestamp: new Date().toISOString(),
  };

  let newMessages = loadMessages();
  newMessages.push(newMessage);
  saveMessages(newMessages);

  currentMessageIndex = newMessages.length - 1;
  startMessageSlider();

  Swal.fire({
    icon: "success",
    title: "Pesan Terkirim!",
    text: `Pesan Anda telah disimpan dan ditampilkan di slider.`,
    confirmButtonColor: "#3085d6",
  });

  form.reset();
  birthdateInput.value = "2000-01-01";

  return true;
}

// ----------------------------------------------------
// IV. INISIALISASI & BURGER MENU SETUP (PERUBAHAN DI SINI)
// ----------------------------------------------------

// Fungsi Kontrol Menu Burger (TAMBAHAN BARU)
function setupBurgerMenu() {
  const burgerButton = document.getElementById("burger-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuOverlay = document.getElementById("menu-overlay");
  const menuLinks = mobileMenu.querySelectorAll("[data-close]");

  const toggleMenu = () => {
    const isOpen = mobileMenu.classList.contains("translate-x-0");

    if (isOpen) {
      // TUTUP MENU
      mobileMenu.classList.remove("translate-x-0");
      mobileMenu.classList.add("translate-x-full");
      menuOverlay.classList.remove("opacity-50");
      // Sembunyikan setelah transisi selesai
      setTimeout(() => menuOverlay.classList.add("hidden"), 300);
    } else {
      // BUKA MENU
      menuOverlay.classList.remove("hidden");
      // Beri sedikit waktu untuk opacity berubah setelah display diaktifkan
      setTimeout(() => menuOverlay.classList.add("opacity-50"), 10);
      mobileMenu.classList.remove("translate-x-full");
      mobileMenu.classList.add("translate-x-0");
    }
  };

  if (burgerButton) {
    burgerButton.addEventListener("click", toggleMenu);
  }
  if (menuOverlay) {
    menuOverlay.addEventListener("click", toggleMenu);
  }

  // Tutup menu saat link diklik
  menuLinks.forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Setup Burger Menu (PANGGILAN BARU)
  setupBurgerMenu();

  // 2. SweetAlert2 akan muncul di sini.
  await setWelcomeSpeech();

  // 3. Start Slider
  startMessageSlider();

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", validateForm);
  }
});
