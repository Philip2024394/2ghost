export type Locale = "en" | "id" | "th" | "vi" | "ms" | "fr";
export type TranslationKey = keyof typeof translations;

export const translations = {
  // ── App branding ──────────────────────────────────────────────────────────────
  "app.tagline":        { en: "Anonymous Dating",           id: "Kencan Anonim",                    th: "หาคู่แบบไม่เปิดเผยตัว",        vi: "Hẹn hò ẩn danh",              ms: "Temu kenalan tanpa nama",          fr: "Rencontres anonymes" },
  "app.name":           { en: "2Ghost",                     id: "2Ghost",                           th: "2Ghost",                        vi: "2Ghost",                       ms: "2Ghost",                           fr: "2Ghost" },

  // ── Navigation ────────────────────────────────────────────────────────────────
  "nav.ghostMode":      { en: "Ghost Mode",                 id: "Ghost Mode",                       th: "Ghost Mode",                    vi: "Ghost Mode",                   ms: "Ghost Mode",                       fr: "Ghost Mode" },
  "nav.membersOnly":    { en: "Members only · Join to explore", id: "Khusus anggota · Daftar untuk menjelajah", th: "สำหรับสมาชิกเท่านั้น · เข้าร่วมเพื่อสำรวจ", vi: "Chỉ dành cho thành viên · Tham gia để khám phá", ms: "Ahli sahaja · Sertai untuk meneroka", fr: "Membres uniquement · Rejoindre pour explorer" },
  "nav.signIn":         { en: "Sign in",                    id: "Masuk",                            th: "เข้าสู่ระบบ",                   vi: "Đăng nhập",                    ms: "Log masuk",                        fr: "Se connecter" },
  "nav.filters":        { en: "Filters",                    id: "Filter",                           th: "ตัวกรอง",                       vi: "Bộ lọc",                       ms: "Penapis",                          fr: "Filtres" },

  // ── Feed ──────────────────────────────────────────────────────────────────────
  "feed.activeNear":    { en: "Guests active near you", id: "Anggota Ghost aktif di dekat Anda", th: "สมาชิก Ghost ที่ใช้งานอยู่ใกล้คุณ", vi: "Thành viên Ghost đang hoạt động gần bạn", ms: "Ahli Ghost aktif berhampiran anda", fr: "Membres Ghost actifs près de vous" },
  "feed.profiles":      { en: "Profiles",                   id: "Profil",                           th: "โปรไฟล์",                       vi: "Hồ sơ",                        ms: "Profil",                           fr: "Profils" },
  "feed.onlineNow":     { en: "Online now",                 id: "Online sekarang",                  th: "ออนไลน์อยู่",                   vi: "Đang trực tuyến",              ms: "Dalam talian sekarang",            fr: "En ligne maintenant" },
  "feed.countries":     { en: "Countries",                  id: "Negara",                           th: "ประเทศ",                        vi: "Quốc gia",                     ms: "Negara",                           fr: "Pays" },
  "feed.activeToday":   { en: "Active today",               id: "Aktif hari ini",                   th: "ใช้งานวันนี้",                  vi: "Hoạt động hôm nay",            ms: "Aktif hari ini",                   fr: "Actif aujourd'hui" },
  "feed.browsing":      { en: "Browsing",                   id: "Menjelajah",                       th: "กำลังดู",                       vi: "Đang xem",                     ms: "Melayari",                         fr: "Parcourir" },
  "feed.listHere":      { en: "List here $9.99",            id: "Daftar di sini $9.99",             th: "ลงที่นี่ $9.99",                vi: "Đăng ký tại đây $9.99",        ms: "Senarai di sini $9.99",            fr: "Lister ici 9,99$" },
  "feed.noProfiles":    { en: "No more profiles",           id: "Tidak ada profil lagi",            th: "ไม่มีโปรไฟล์เพิ่มเติม",        vi: "Không còn hồ sơ",              ms: "Tiada lagi profil",                fr: "Plus de profils" },

  // ── Profile card ──────────────────────────────────────────────────────────────
  "card.tonight":       { en: "Tonight",                    id: "Malam ini",                        th: "คืนนี้",                        vi: "Tối nay",                      ms: "Malam ini",                        fr: "Ce soir" },
  "card.members":       { en: "MEMBERS",                    id: "ANGGOTA",                          th: "สมาชิก",                        vi: "THÀNH VIÊN",                   ms: "AHLI",                             fr: "MEMBRES" },
  "card.verified":      { en: "Verified",                   id: "Terverifikasi",                    th: "ยืนยันแล้ว",                    vi: "Đã xác minh",                  ms: "Disahkan",                         fr: "Vérifié" },
  "card.online":        { en: "Online",                     id: "Online",                           th: "ออนไลน์",                       vi: "Trực tuyến",                   ms: "Dalam talian",                     fr: "En ligne" },
  "card.woman":         { en: "Woman",                      id: "Wanita",                           th: "ผู้หญิง",                       vi: "Phụ nữ",                       ms: "Wanita",                           fr: "Femme" },
  "card.man":           { en: "Man",                        id: "Pria",                             th: "ผู้ชาย",                        vi: "Đàn ông",                      ms: "Lelaki",                           fr: "Homme" },

  // ── Buttons ───────────────────────────────────────────────────────────────────
  "btn.like":           { en: "Like",                       id: "Suka",                             th: "ถูกใจ",                         vi: "Thích",                        ms: "Suka",                             fr: "J'aime" },
  "btn.pass":           { en: "Pass",                       id: "Lewati",                           th: "ข้าม",                          vi: "Bỏ qua",                       ms: "Lepas",                            fr: "Passer" },
  "btn.connect":        { en: "Connect",                    id: "Hubungkan",                        th: "เชื่อมต่อ",                     vi: "Kết nối",                      ms: "Sambung",                          fr: "Connecter" },
  "btn.unlock":         { en: "Unlock to Connect",          id: "Buka untuk Menghubungi",           th: "ปลดล็อกเพื่อเชื่อมต่อ",        vi: "Mở khóa để kết nối",          ms: "Buka kunci untuk menyambung",      fr: "Débloquer pour connecter" },
  "btn.joinGhost":      { en: "Join Ghost Vaults",           id: "Gabung Ghost Vaults",               th: "เข้าร่วม Ghost Vaults",          vi: "Tham gia Ghost Vaults",         ms: "Sertai Ghost Vaults",               fr: "Rejoindre Ghost Vaults" },
  "btn.enterGhostMode": { en: "Enter Ghost Mode",           id: "Masuk Ghost Mode",                 th: "เข้าสู่ Ghost Mode",            vi: "Vào Ghost Mode",               ms: "Masuk Ghost Mode",                 fr: "Entrer en Ghost Mode" },
  "btn.save":           { en: "Save",                       id: "Simpan",                           th: "บันทึก",                        vi: "Lưu",                          ms: "Simpan",                           fr: "Enregistrer" },
  "btn.back":           { en: "Back",                       id: "Kembali",                          th: "กลับ",                          vi: "Trở lại",                      ms: "Kembali",                          fr: "Retour" },
  "btn.cancel":         { en: "Cancel",                     id: "Batal",                            th: "ยกเลิก",                        vi: "Hủy",                          ms: "Batal",                            fr: "Annuler" },
  "btn.close":          { en: "Close",                      id: "Tutup",                            th: "ปิด",                           vi: "Đóng",                         ms: "Tutup",                            fr: "Fermer" },
  "btn.confirm":        { en: "Confirm",                    id: "Konfirmasi",                       th: "ยืนยัน",                        vi: "Xác nhận",                     ms: "Sahkan",                           fr: "Confirmer" },
  "btn.justBrowsing":   { en: "Just browsing for now",      id: "Hanya melihat-lihat",              th: "แค่ดูก่อน",                     vi: "Chỉ xem thôi",                 ms: "Sekadar melayari",                 fr: "Je regarde pour l'instant" },

  // ── Setup page ────────────────────────────────────────────────────────────────
  "setup.title":        { en: "Create your Ghost Profile",  id: "Buat Profil Ghost Anda",           th: "สร้างโปรไฟล์ Ghost ของคุณ",     vi: "Tạo hồ sơ Ghost của bạn",     ms: "Buat Profil Ghost anda",           fr: "Créer votre profil Ghost" },
  "setup.photo":        { en: "Your photo",                 id: "Foto Anda",                        th: "รูปของคุณ",                     vi: "Ảnh của bạn",                  ms: "Foto anda",                        fr: "Votre photo" },
  "setup.name":         { en: "Your name",                  id: "Nama Anda",                        th: "ชื่อของคุณ",                    vi: "Tên của bạn",                  ms: "Nama anda",                        fr: "Votre prénom" },
  "setup.age":          { en: "Your age",                   id: "Usia Anda",                        th: "อายุของคุณ",                    vi: "Tuổi của bạn",                 ms: "Umur anda",                        fr: "Votre âge" },
  "setup.city":         { en: "Your city",                  id: "Kota Anda",                        th: "เมืองของคุณ",                   vi: "Thành phố của bạn",            ms: "Bandar anda",                      fr: "Votre ville" },
  "setup.gender":       { en: "I am a",                     id: "Saya seorang",                     th: "ฉันเป็น",                       vi: "Tôi là",                       ms: "Saya seorang",                     fr: "Je suis" },
  "setup.woman":        { en: "Woman",                      id: "Wanita",                           th: "ผู้หญิง",                       vi: "Phụ nữ",                       ms: "Wanita",                           fr: "Femme" },
  "setup.man":          { en: "Man",                        id: "Pria",                             th: "ผู้ชาย",                        vi: "Đàn ông",                      ms: "Lelaki",                           fr: "Homme" },
  "setup.bio":          { en: "Short bio (optional)",       id: "Bio singkat (opsional)",           th: "ประวัติสั้น (ไม่บังคับ)",       vi: "Giới thiệu ngắn (tùy chọn)",  ms: "Bio ringkas (pilihan)",            fr: "Courte bio (facultatif)" },
  "setup.interests":    { en: "Your interests (pick up to 3)", id: "Minat Anda (pilih max 3)",      th: "ความสนใจ (เลือกได้ 3)",         vi: "Sở thích (chọn tối đa 3)",     ms: "Minat anda (pilih hingga 3)",      fr: "Vos intérêts (choisissez 3 max)" },
  "setup.phone":        { en: "Your phone number",          id: "Nomor telepon Anda",               th: "หมายเลขโทรศัพท์ของคุณ",        vi: "Số điện thoại của bạn",        ms: "Nombor telefon anda",              fr: "Votre numéro de téléphone" },
  "setup.phoneDesc":    { en: "Shared privately on mutual match", id: "Dibagikan saat mutual match", th: "แชร์เป็นส่วนตัวเมื่อแมตช์กัน", vi: "Chia sẻ riêng tư khi match",  ms: "Dikongsi peribadi apabila match",  fr: "Partagé en privé après un match mutuel" },
  "setup.altPlatform":  { en: "Also on (optional)",        id: "Juga ada di (opsional)",           th: "ยังอยู่บน (ไม่บังคับ)",         vi: "Cũng dùng (tùy chọn)",         ms: "Juga di (pilihan)",                fr: "Aussi sur (facultatif)" },
  "setup.saving":       { en: "Saving...",                  id: "Menyimpan...",                     th: "กำลังบันทึก...",                 vi: "Đang lưu...",                  ms: "Menyimpan...",                     fr: "Enregistrement..." },
  "setup.privacy":      { en: "Your contact is shared privately after a mutual match only", id: "Kontak dibagikan privat setelah mutual match", th: "ข้อมูลติดต่อแชร์เป็นส่วนตัวหลัง mutual match เท่านั้น", vi: "Thông tin liên hệ chỉ chia sẻ riêng tư sau khi match", ms: "Kenalan dikongsi peribadi selepas mutual match sahaja", fr: "Vos coordonnées sont partagées en privé après un match mutuel uniquement" },
  "setup.enterGhost":   { en: "Enter Ghost Mode",           id: "Masuk Ghost Mode",                 th: "เข้าสู่ Ghost Mode",            vi: "Vào Ghost Mode",               ms: "Masuk Ghost Mode",                 fr: "Entrer en Ghost Mode" },

  // ── Ghost Vault ────────────────────────────────────────────────────────────────
  "room.title":         { en: "Ghost Vault",                 id: "Ghost Vault",                       th: "Ghost Vault",                    vi: "Ghost Vault",                   ms: "Ghost Vault",                       fr: "Ghost Vault" },
  "room.matches":       { en: "Your Matches",               id: "Match Anda",                       th: "แมตช์ของคุณ",                   vi: "Các cặp đôi của bạn",          ms: "Padanan anda",                     fr: "Vos matchs" },
  "room.noMatches":     { en: "No matches yet",             id: "Belum ada match",                  th: "ยังไม่มีแมตช์",                 vi: "Chưa có cặp đôi",             ms: "Belum ada padanan",                fr: "Pas encore de match" },
  "room.expires":       { en: "Expires in",                 id: "Kadaluarsa dalam",                 th: "หมดอายุใน",                     vi: "Hết hạn trong",                ms: "Tamat dalam",                      fr: "Expire dans" },

  // ── Match popup ───────────────────────────────────────────────────────────────
  "match.title":        { en: "It's a Match!",              id: "Ini Cocok!",                       th: "แมตช์กันแล้ว!",                vi: "Đây là một cặp!",              ms: "Ini padanan!",                     fr: "C'est un match!" },
  "match.likedEachOther": { en: "You liked each other",    id: "Kalian saling menyukai",           th: "คุณถูกใจซึ่งกันและกัน",        vi: "Các bạn thích nhau",           ms: "Anda saling menyukai",             fr: "Vous vous êtes aimés mutuellement" },
  "match.connectNow":   { en: "Connect Now",                id: "Hubungi Sekarang",                 th: "เชื่อมต่อตอนนี้",              vi: "Kết nối ngay",                 ms: "Sambung sekarang",                 fr: "Connecter maintenant" },
  "match.later":        { en: "Maybe later",                id: "Mungkin nanti",                    th: "ไว้คราวหลัง",                   vi: "Có thể sau",                   ms: "Mungkin nanti",                    fr: "Peut-être plus tard" },
  "match.connected":    { en: "You're Connected!",          id: "Anda Terhubung!",                  th: "คุณเชื่อมต่อแล้ว!",             vi: "Bạn đã kết nối!",              ms: "Anda Tersambung!",                 fr: "Vous êtes connectés!" },

  // ── Paywall ───────────────────────────────────────────────────────────────────
  "pay.womenFree":      { en: "Women join free forever",    id: "Wanita gratis selamanya",          th: "ผู้หญิงเข้าร่วมฟรีตลอดไป",     vi: "Phụ nữ tham gia miễn phí",     ms: "Wanita sertai percuma selamanya",  fr: "Les femmes rejoignent gratuitement" },
  "pay.foundingGhost":  { en: "Founding Ghost",             id: "Founding Ghost",                   th: "Founding Ghost",                vi: "Founding Ghost",               ms: "Founding Ghost",                   fr: "Founding Ghost" },
  "pay.monthly":        { en: "Ghost Monthly",              id: "Ghost Bulanan",                    th: "Ghost รายเดือน",                vi: "Ghost hàng tháng",             ms: "Ghost Bulanan",                    fr: "Ghost Mensuel" },
  "pay.perMonth":       { en: "per month · cancel anytime", id: "per bulan · batalkan kapan saja", th: "ต่อเดือน · ยกเลิกได้ตลอด",     vi: "mỗi tháng · hủy bất cứ lúc nào", ms: "sebulan · batalkan bila-bila masa", fr: "par mois · annuler à tout moment" },
  "pay.choosePlan":     { en: "Choose your plan",           id: "Pilih paket Anda",                 th: "เลือกแผนของคุณ",                vi: "Chọn gói của bạn",             ms: "Pilih pelan anda",                 fr: "Choisissez votre forfait" },

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  "dash.title":         { en: "My Ghost Profile",           id: "Profil Ghost Saya",                th: "โปรไฟล์ Ghost ของฉัน",          vi: "Hồ sơ Ghost của tôi",          ms: "Profil Ghost saya",                fr: "Mon profil Ghost" },
  "dash.likesToday":    { en: "Likes Today",                id: "Suka Hari Ini",                    th: "ถูกใจวันนี้",                   vi: "Thích hôm nay",                ms: "Suka Hari Ini",                    fr: "J'aime aujourd'hui" },
  "dash.streak":        { en: "Day Streak",                 id: "Hari Berturut",                    th: "วันต่อเนื่อง",                  vi: "Chuỗi ngày",                   ms: "Hari Berturut",                    fr: "Série de jours" },
  "dash.matches":       { en: "Matches",                    id: "Match",                            th: "แมตช์",                         vi: "Cặp đôi",                      ms: "Padanan",                          fr: "Matchs" },
  "dash.howIConnect":   { en: "How I Connect",              id: "Cara Saya Terhubung",              th: "วิธีที่ฉันเชื่อมต่อ",           vi: "Cách tôi kết nối",             ms: "Cara saya berhubung",              fr: "Comment je me connecte" },
  "dash.activityToday": { en: "Activity Today",             id: "Aktivitas Hari Ini",               th: "กิจกรรมวันนี้",                 vi: "Hoạt động hôm nay",            ms: "Aktiviti Hari Ini",                fr: "Activité aujourd'hui" },

  // ── International Ghost ───────────────────────────────────────────────────────
  "intl.title":         { en: "International Ghost",        id: "Ghost Internasional",              th: "Ghost นานาชาติ",                vi: "Ghost Quốc tế",                ms: "Ghost Antarabangsa",               fr: "Ghost International" },
  "intl.desc":          { en: "List your profile in other countries", id: "Daftarkan profil di negara lain", th: "ลงโปรไฟล์ในประเทศอื่น", vi: "Đăng hồ sơ ở các quốc gia khác", ms: "Senaraikan profil di negara lain", fr: "Listez votre profil dans d'autres pays" },
  "intl.freeForWomen":  { en: "Free for women",             id: "Gratis untuk wanita",              th: "ฟรีสำหรับผู้หญิง",              vi: "Miễn phí cho phụ nữ",          ms: "Percuma untuk wanita",             fr: "Gratuit pour les femmes" },
  "intl.perMonth":      { en: "$9.99 / month for men",      id: "$9.99 / bulan untuk pria",        th: "$9.99 / เดือน สำหรับผู้ชาย",    vi: "$9.99 / tháng cho đàn ông",    ms: "$9.99 / bulan untuk lelaki",       fr: "9,99$ / mois pour les hommes" },

  // ── Gateway / Welcome modal ───────────────────────────────────────────────────
  "gateway.welcome":    { en: "Welcome to Ghost Vaults",     id: "Selamat Datang di Ghost Vaults",    th: "ยินดีต้อนรับสู่ Ghost Vaults",   vi: "Chào mừng đến Ghost Vaults",    ms: "Selamat datang ke Ghost Vaults",    fr: "Bienvenue dans Ghost Vaults" },
  "gateway.houseRules": { en: "The House Rules",            id: "Aturan Rumah",                     th: "กฎของบ้าน",                     vi: "Quy tắc của nhà",              ms: "Peraturan Rumah",                  fr: "Les règles de la maison" },
  "gateway.howItWorks": { en: "How Ghost Vaults Works",      id: "Cara Kerja Ghost Vaults",           th: "วิธีการทำงานของ Ghost Vaults",   vi: "Cách Ghost Vaults hoạt động",   ms: "Cara Ghost Vaults Berfungsi",       fr: "Comment Ghost Vaults fonctionne" },
  "gateway.accept":     { en: "I accept 2Ghost Rules",      id: "Saya menerima Aturan 2Ghost",      th: "ฉันยอมรับกฎ 2Ghost",            vi: "Tôi chấp nhận Quy tắc 2Ghost", ms: "Saya terima Peraturan 2Ghost",     fr: "J'accepte les règles 2Ghost" },
  "gateway.entering":   { en: "Entering Ghost Mode...",     id: "Memasuki Ghost Mode...",           th: "กำลังเข้าสู่ Ghost Mode...",    vi: "Đang vào Ghost Mode...",       ms: "Memasuki Ghost Mode...",           fr: "Entrée en Ghost Mode..." },
  "gateway.previewMode":{ en: "You're in Preview Mode",     id: "Anda dalam Mode Pratinjau",        th: "คุณอยู่ในโหมดตัวอย่าง",        vi: "Bạn đang ở chế độ xem trước", ms: "Anda dalam Mod Pratonton",         fr: "Vous êtes en mode aperçu" },

  // ── General ───────────────────────────────────────────────────────────────────
  "general.km":         { en: "km",                         id: "km",                               th: "กม.",                           vi: "km",                           ms: "km",                               fr: "km" },
  "general.free":       { en: "Free",                       id: "Gratis",                           th: "ฟรี",                           vi: "Miễn phí",                     ms: "Percuma",                          fr: "Gratuit" },
  "general.joinFree":   { en: "Join Free",                  id: "Daftar Gratis",                    th: "เข้าร่วมฟรี",                   vi: "Tham gia miễn phí",            ms: "Sertai Percuma",                   fr: "Rejoindre gratuitement" },
  "general.or":         { en: "or",                         id: "atau",                             th: "หรือ",                          vi: "hoặc",                         ms: "atau",                             fr: "ou" },
  "general.loading":    { en: "Loading...",                  id: "Memuat...",                        th: "กำลังโหลด...",                  vi: "Đang tải...",                  ms: "Memuatkan...",                     fr: "Chargement..." },
} as const;
