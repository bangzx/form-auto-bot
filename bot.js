const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

// Clear terminal sebelum menampilkan banner
try {
    execSync(process.platform === "win32" ? "cls" : "clear", { stdio: "inherit" });
} catch (e) {
    console.log("Gagal menghapus layar.");
}

// Banner ASCI I
const banner = `
  █████╗ ██╗   ██╗████████╗ ██████╗
 ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
 ███████║██║   ██║   ██║   ██║   ██║   
 ██╔══██║██║   ██║   ██║   ██║   ██║ 
 ██║  ██║╚██████╔╝   ██║   ╚██████╔╝ 
 ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝    
[🔥] Telegram: http://t.me/airdropfetchofficial
`;

console.log(banner);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// Fungsi untuk membuat username Twitter random (lebih natural)
const generateTwitterUsername = () => {
  const names = [
    "rangga", "silvia", "aditya", "melisa", "budi", "angga", "denis", "natalia",
    "farhan", "siska", "joko", "ratna", "yoga", "cindy", "fajar", "dinda",
    "rudi", "karina", "agus", "nadia", "andi", "sabrina", "rizky", "felicia",
    "taufik", "sari", "dian", "david", "lina", "bayu", "putri", "reza",
    "fauzan", "wulan", "hendrik", "maria", "eko", "veronika", "wahyu", "yuli"
  ];

  const name = names[Math.floor(Math.random() * names.length)];
  const number = Math.floor(10 + Math.random() * 90); // Angka acak 10-99
  return `${name}${number}`;
};

// Fungsi untuk membaca wallet dari file wallets.txt
const getWallets = () => {
  if (!fs.existsSync("wallets.txt")) {
    console.log("[❌] File wallets.txt tidak ditemukan!");
    process.exit(1);
  }
  return fs.readFileSync("wallets.txt", "utf8").split("\n").map(line => line.trim()).filter(line => line);
};

// Fungsi untuk login ke Google
const loginGoogle = async (page, email, password) => {
    console.log("[🔑] Login ke Google...");
  
    await page.goto("https://accounts.google.com/signin", { waitUntil: "networkidle2" });
  
    // Isi email
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.type('input[type="email"]', email);
    await page.keyboard.press("Enter");
  
    // Tunggu halaman password muncul
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });
  
    // Isi password
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', password);
    await page.keyboard.press("Enter");
  
    // Tunggu login selesai
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    console.log("[✅] Login Google berhasil!");
  };

// Fungsi untuk mengisi Google Form
const fillGoogleForm = async (formLink, total, headless, login, email, password) => {
  const wallets = getWallets();
  if (wallets.length === 0) {
    console.log("[❌] Tidak ada alamat BSC dalam wallets.txt!");
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: headless === "y" });
  const page = await browser.newPage();

  // Login Google jika dipilih
  if (login === "y") {
    await loginGoogle(page, email, password);
  }

  for (let i = 0; i < total; i++) {
    console.log(`\n[✅] Mengisi formulir ke-${i + 1}...`);

    const twitterUsername = generateTwitterUsername();
    const walletAddress = wallets[i % wallets.length];

    await page.goto(formLink, { waitUntil: "networkidle2" });

    // Cari semua input field di dalam form
    const inputFields = await page.$$('input[type="text"]');
    if (inputFields.length < 2) {
      console.log("[❌] Form tidak memiliki cukup input field!");
      continue;
    }

    // Isi username Twitter (field pertama)
    await inputFields[0].type(twitterUsername);
    console.log(`[✅] Twitter: ${twitterUsername}`);

    // Isi Wallet Address (field kedua)
    await inputFields[1].type(walletAddress);
    console.log(`[✅] BSC Address: ${walletAddress}`);

    // Klik tombol submit
    const submitButton = await page.$('button[type="submit"], div[role="button"]');
    if (submitButton) {
      await submitButton.click();
      console.log("[🚀] Formulir berhasil dikirim!");
    } else {
      console.log("[❌] Tombol submit tidak ditemukan!");
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  await browser.close();
};

// Menjalankan program dengan input terminal
(async () => {
  const formLink = await askQuestion("Masukkan link Google Form: ");
  const login = await askQuestion("Login Google? (y/n): ");
  let email = "", password = "";

  if (login === "y") {
    email = await askQuestion("Masukkan email Google: ");
    password = await askQuestion("Masukkan password Google: ");
  }

  const total = parseInt(await askQuestion("Berapa kali mengisi formulir? "));
  const headless = await askQuestion("Mode Headless? (y/n): ");

  rl.close();
  await fillGoogleForm(formLink, total, headless, login, email, password);
})();
