import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enhanced sample writings for Afterstill
const writings = [
  // Original writings
  {
    id: "memory-of-rain",
    title: "Memory of Rain",
    date: "2024-09-12",
    tags: ["Memory", "Silence", "Ritual"],
    excerpt:
      "Hujan turun seperti arsip yang hidup, menyalin ulang kenangan di permukaan kota.",
    content: `Hujan turun seperti arsip yang hidup, menyalin ulang kenangan di permukaan kota. Aku berjalan perlahan, menghafal pola tetes yang menyentuh genteng dan aspal. Di antara suara itu, ada jeda-jeda kecil yang menenangkan.

Namun di balik ketenangan, ada pertanyaan yang menunggu: apa yang ingin kita simpan, dan apa yang ingin kita lepaskan?

Setiap tetes hujan adalah pengingat bahwa waktu terus berjalan, menyapu jejak-jejak lama sambil meninggalkan yang baru. Mungkin itulah mengapa hujan selalu terasa nostalgis—ia adalah jembatan antara masa lalu dan saat ini.`,
    readingTime: 2,
    category: "reflection",
  },
  {
    id: "quiet-algorithms",
    title: "Quiet Algorithms",
    date: "2024-10-02",
    tags: ["Algorithm", "Breath", "Focus"],
    excerpt:
      "Algoritma tak selalu berisik; kadang ia bekerja seperti napas yang teratur.",
    content: `Algoritma tak selalu berisik; kadang ia bekerja seperti napas yang teratur. Setiap baris kode adalah upaya kecil untuk menata kekacauan. Tetapi saat perhatian kita retak, pola itu ikut kabur.

Di situlah sunyi menjadi struktur, bukan kekosongan.

Kita sering lupa bahwa di balik setiap program yang berjalan mulus, ada ritme yang tak terdengar—seperti detak jantung digital yang menjaga semuanya tetap berputar dalam harmoni yang sempurna.`,
    readingTime: 2,
    category: "technology",
  },
  {
    id: "fragments-of-dawn",
    title: "Fragments of Dawn",
    date: "2024-11-14",
    tags: ["Dawn", "Hope", "Light"],
    excerpt:
      "Pagi menyapu sisa gelap, menyisakan fragmen cahaya yang jujur.",
    content: `Pagi menyapu sisa gelap, menyisakan fragmen cahaya yang jujur. Meski begitu, hari tidak selalu ramah. Ada detik-detik ketika kita harus memilih: bertahan atau membiarkan diri terbit lagi.

Di sana, harapan bukan janji, melainkan kebiasaan kecil.

Fragmen demi fragmen, cahaya pertama itu mengajari kita tentang kesabaran—bahwa perubahan tidak harus dramatis untuk menjadi bermakna. Kadang, cukup dengan membuka mata dan menerima apa yang datang.`,
    readingTime: 2,
    category: "poetry",
  },
  {
    id: "ink-and-orbit",
    title: "Ink & Orbit",
    date: "2024-12-01",
    tags: ["Orbit", "Language", "Gravity"],
    excerpt:
      "Tulisan bergerak seperti planet, mengitari makna yang tak selalu terlihat.",
    content: `Tulisan bergerak seperti planet, mengitari makna yang tak selalu terlihat. Ada gravitasi halus yang membuat kita kembali pada kata-kata tertentu.

Namun orbit tak pernah benar-benar sama; ia adalah variasi dari rindu pada pusat yang sama.

Mungkin itulah mengapa kita terus menulis—bukan untuk mencapai tujuan, tetapi untuk terus berputar dalam tarian abadi dengan ide-ide yang tak pernah selesai kita pahami.`,
    readingTime: 2,
    category: "philosophy",
  },
  {
    id: "blue-silence",
    title: "Blue Silence",
    date: "2025-01-19",
    tags: ["Silence", "Blue", "Reflection"],
    excerpt: "Kesunyian biru menyimpan gema yang paling jujur.",
    content: `Kesunyian biru menyimpan gema yang paling jujur. Kadang kita takut pada hening karena ia memperlihatkan diri kita tanpa distraksi.

Tetapi dari situ, muncul pengertian baru: sunyi bukan lawan suara, ia adalah ruang bagi makna.

Seperti langit di jam-jam terakhir senja, kesunyian biru adalah transisi—bukan akhir, bukan awal, tetapi jembatan menuju pemahaman yang lebih dalam tentang siapa kita sebenarnya.`,
    readingTime: 2,
    category: "reflection",
  },
  {
    id: "breathing-letters",
    title: "Breathing Letters",
    date: "2025-02-05",
    tags: ["Breath", "Language", "Ritual"],
    excerpt: "Huruf-huruf bernapas, menjadikan bacaan sebagai ritual harian.",
    content: `Huruf-huruf bernapas, menjadikan bacaan sebagai ritual harian. Saat kita membaca dengan pelan, ada ritme yang menuntun pikiran untuk tinggal lebih lama.

Walau sederhana, ritme itu menyalakan rasa ingin tahu yang baru.

Membaca adalah meditasi yang sering diabaikan. Dalam setiap paragraf, ada undangan untuk berhenti sejenak dan merasakan bobot kata-kata yang dipilih dengan hati-hati oleh penulisnya.`,
    readingTime: 2,
    category: "literature",
  },
  {
    id: "fractal-letters",
    title: "Fractal Letters",
    date: "2025-03-02",
    tags: ["Fractal", "Pattern", "Mind"],
    excerpt:
      "Pola-pola kecil membentuk semesta makna yang berulang dan bertumbuh.",
    content: `Pola-pola kecil membentuk semesta makna yang berulang dan bertumbuh. Seperti fractal, satu kalimat dapat memantulkan keseluruhan gagasan.

Namun ketika kita membaca ulang, sudut pandang ikut berubah.

Inilah keajaiban bahasa: ia tidak statis. Setiap kali kita kembali pada teks yang sama, kita membawa pengalaman baru yang mengubah cara kita menafsirkan maknanya.`,
    readingTime: 2,
    category: "philosophy",
  },
  {
    id: "dawn-of-quiet",
    title: "Dawn of Quiet",
    date: "2025-04-11",
    tags: ["Dawn", "Silence", "Focus"],
    excerpt: "Subuh membawa kesunyian yang memusatkan pikiran.",
    content: `Subuh membawa kesunyian yang memusatkan pikiran. Tidak ada keramaian, hanya suara langkah sendiri.

Tetapi di sana, ide-ide menemukan ritme. Seolah pagi mengajarkan: fokus adalah bentuk kasih pada diri sendiri.

Di jam-jam awal itu, dunia belum menuntut apa-apa dari kita. Kita bebas untuk sekadar ada—tanpa produktivitas, tanpa ekspektasi, hanya hadir dalam keheningan yang mengayomi.`,
    readingTime: 2,
    category: "mindfulness",
  },
  {
    id: "memory-ribbon",
    title: "Memory Ribbon",
    date: "2025-05-01",
    tags: ["Memory", "Thread", "Bloom"],
    excerpt: "Jejak kecil mengikat fragmen pengalaman menjadi pita ingatan.",
    content: `Jejak kecil mengikat fragmen pengalaman menjadi pita ingatan. Kita sering lupa, tetapi tubuh menyimpan pola.

Meski samar, pola itu dapat menuntun kita kembali ke awal.

Ingatan adalah narasi yang terus ditulis ulang. Setiap kali kita mengingatnya, kita menambahkan lapisan baru—warna yang berbeda, nuansa yang berubah seiring perjalanan waktu.`,
    readingTime: 2,
    category: "reflection",
  },

  // New enhanced writings
  {
    id: "digital-monastery",
    title: "Digital Monastery",
    date: "2025-05-10",
    tags: ["Technology", "Solitude", "Focus"],
    excerpt: "Dalam hiruk-pikuk notifikasi, ada ruang untuk keheningan digital.",
    content: `Dalam hiruk-pikuk notifikasi, ada ruang untuk keheningan digital. Layar yang biasanya menjerit minta perhatian dapat diubah menjadi taman kontemplasi.

Ini bukan tentang melarikan diri dari teknologi, tetapi tentang menggunakannya dengan kesadaran penuh. Setiap klik, setiap scroll, setiap ketikan menjadi tindakan yang disengaja.

Di biara digital ini, kita belajar bahwa batasan adalah bentuk kebebasan. Dengan memilih apa yang kita konsumsi, kita merebut kembali kendali atas pikiran kita sendiri.

Mungkin masa depan spiritualitas tidak terletak pada penolakan teknologi, tetapi pada integrasi yang bijaksana—menemukan yang sakral dalam yang digital.`,
    readingTime: 3,
    category: "technology",
  },
  {
    id: "typography-of-silence",
    title: "Typography of Silence",
    date: "2025-05-15",
    tags: ["Design", "Silence", "Space"],
    excerpt: "Ruang kosong dalam desain berbicara lebih keras dari kata-kata.",
    content: `Ruang kosong dalam desain berbicara lebih keras dari kata-kata. Whitespace bukan ketiadaan—ia adalah pernapasan visual yang memberi makna pada elemen di sekitarnya.

Para tipografer hebat memahami ini: bahwa jarak antar huruf sama pentingnya dengan huruf itu sendiri. Dalam keheningan tipografis, mata menemukan istirahat dan pikiran menemukan ruang untuk menyerap.

Begitu pula dalam hidup. Kita terlalu sering mengisi setiap momen dengan aktivitas, lupa bahwa jeda adalah bagian dari komposisi yang indah.

Belajarlah dari halaman yang dirancang dengan baik: biarkan ada ruang untuk bernapas.`,
    readingTime: 3,
    category: "design",
  },
  {
    id: "night-architecture",
    title: "Night Architecture",
    date: "2025-05-20",
    tags: ["Night", "Structure", "Dream"],
    excerpt: "Malam membangun arsitekturnya sendiri dari bayangan dan cahaya bulan.",
    content: `Malam membangun arsitekturnya sendiri dari bayangan dan cahaya bulan. Gedung-gedung yang familiar di siang hari bertransformasi menjadi bentuk-bentuk yang lebih mistis.

Di kegelapan, imajinasi mengambil alih. Sudut-sudut menjadi portal, lorong-lorong menjadi labirin kemungkinan. Malam mengajarkan kita bahwa realitas bukan sesuatu yang tetap.

Ada arsitektur lain yang dibangun di malam hari: arsitektur pikiran. Dalam tidur, otak menyusun ulang pengalaman, membangun jembatan antara memori, menciptakan ruang-ruang baru untuk pemahaman.

Mungkin itulah mengapa mimpi terasa begitu nyata—mereka adalah bangunan yang dibangun dengan material paling fundamental: kesadaran itu sendiri.`,
    readingTime: 4,
    category: "poetry",
  },
  {
    id: "slow-reading-manifesto",
    title: "Slow Reading Manifesto",
    date: "2025-05-25",
    tags: ["Reading", "Ritual", "Mindfulness"],
    excerpt: "Di era informasi berlebih, membaca lambat adalah bentuk perlawanan.",
    content: `Di era informasi berlebih, membaca lambat adalah bentuk perlawanan. Kita dilatih untuk skim, scan, dan skip—kehilangan kedalaman demi keluasan yang semu.

Manifesto ini sederhana: baca satu paragraf. Berhenti. Rasakan. Biarkan kata-kata meresap sebelum melanjutkan.

Pembacaan lambat bukan tentang kecepatan, tetapi tentang kehadiran. Ini tentang menghormati penulis yang telah menghabiskan waktu untuk memilih setiap kata, dan menghormati diri sendiri dengan memberikan perhatian penuh.

Dalam dunia yang menuntut kita untuk selalu multitasking, fokus pada satu teks adalah tindakan radikal. Ini adalah meditasi yang menyamar sebagai aktivitas biasa.

Cobalah: matikan notifikasi, tutup tab lain, dan tenggelamkan diri dalam satu halaman. Rasakan perbedaannya.`,
    readingTime: 4,
    category: "mindfulness",
  },
  {
    id: "constellation-of-ideas",
    title: "Constellation of Ideas",
    date: "2025-06-01",
    tags: ["Ideas", "Connection", "Mind"],
    excerpt: "Ide-ide terhubung seperti bintang membentuk rasi di langit pikiran.",
    content: `Ide-ide terhubung seperti bintang membentuk rasi di langit pikiran. Satu insight yang tampak terisolasi mungkin adalah bagian dari pola yang lebih besar.

Para pemikir hebat tidak hanya mengumpulkan fakta—mereka melihat hubungan. Mereka menarik garis imajiner antara titik-titik yang tampak tidak berkaitan, menciptakan bentuk-bentuk baru dari kekosongan.

Ini adalah seni navigasi intelektual: menggunakan konstelasi yang ada sebagai panduan sambil tetap terbuka pada konfigurasi baru.

Mungkin kreativitas bukan tentang menciptakan dari ketiadaan, tetapi tentang melihat koneksi yang selalu ada di sana, tersembunyi di balik kebiasaan berpikir kita.

Malam ini, lihat ke langit pikiranmu. Rasi apa yang terbentuk dari ide-ide yang telah kau kumpulkan?`,
    readingTime: 4,
    category: "philosophy",
  },
  {
    id: "ambient-productivity",
    title: "Ambient Productivity",
    date: "2025-06-05",
    tags: ["Focus", "Environment", "Work"],
    excerpt: "Lingkungan membentuk pikiran; desainlah ruangmu untuk kejernihan.",
    content: `Lingkungan membentuk pikiran; desainlah ruangmu untuk kejernihan. Produktivitas bukan hanya tentang teknik dan aplikasi—ini tentang menciptakan atmosfer yang mendukung fokus.

Pencahayaan yang tepat, suara latar yang tenang, suhu yang nyaman. Detail-detail kecil ini terakumulasi menjadi kondisi optimal untuk pekerjaan mendalam.

Tetapi ambient productivity lebih dari sekadar ergonomi. Ini tentang menciptakan ritual-ritual kecil yang memberi sinyal pada otak: saatnya fokus. Aroma kopi tertentu, playlist khusus, sudut meja yang selalu rapi.

Pikiran kita adalah refleksi dari ruang di sekitar kita. Chaos eksternal menciptakan chaos internal. Sebaliknya, ketenangan di luar dapat menumbuhkan ketenangan di dalam.

Pertanyaannya bukan "bagaimana agar lebih produktif?" tetapi "lingkungan seperti apa yang membuat fokus terasa alami?"`,
    readingTime: 4,
    category: "mindfulness",
  },
  {
    id: "ephemeral-code",
    title: "Ephemeral Code",
    date: "2025-06-10",
    tags: ["Code", "Impermanence", "Craft"],
    excerpt: "Kode yang kita tulis hari ini mungkin usang besok, namun tetap berharga.",
    content: `Kode yang kita tulis hari ini mungkin usang besok, namun tetap berharga. Ada keindahan dalam sifat fana dari perangkat lunak—ia mengajarkan kita untuk tidak terlalu terikat pada hasil.

Setiap commit adalah snapshot dari pemahaman kita pada momen tertentu. Kita tumbuh, kode kita juga. Yang ditulis dengan bangga tahun lalu mungkin membuat kita malu sekarang.

Ini bukan kegagalan—ini adalah bukti perkembangan. Programmer yang baik tidak hanya menulis kode yang berfungsi, tetapi kode yang dapat digantikan dengan mudah ketika ada pendekatan yang lebih baik.

Dalam dunia yang mengejar "legacy code" abadi, mungkin kita perlu merayakan yang ephemeral. Kode sekali pakai yang menyelesaikan masalah hari ini memiliki nilai tersendiri.

Tulislah dengan presisi, tetapi lepaskan dengan ringan.`,
    readingTime: 4,
    category: "technology",
  },
  {
    id: "garden-of-notes",
    title: "Garden of Notes",
    date: "2025-06-15",
    tags: ["Notes", "Growth", "Knowledge"],
    excerpt: "Catatan yang ditanam dan dirawat tumbuh menjadi kebun pengetahuan.",
    content: `Catatan yang ditanam dan dirawat tumbuh menjadi kebun pengetahuan. Berbeda dengan arsip yang statis, kebun adalah sistem hidup yang terus berevolusi.

Setiap catatan adalah benih. Beberapa tumbuh subur, bercabang ke berbagai arah. Yang lain mungkin tidak pernah berkecambah—dan itu tidak apa-apa. Tidak setiap ide perlu menjadi pohon besar.

Berkebun catatan berarti kembali secara reguler: menyiram dengan refleksi baru, memangkas yang tidak lagi relevan, menanam koneksi antar konsep.

Ini adalah praktik yang membutuhkan kesabaran. Kebun yang indah tidak terbentuk dalam semalam. Tetapi setelah bertahun-tahun, kau akan memiliki ekosistem ide yang unik—lanskap intelektual yang hanya milikmu.

Mulailah dengan satu catatan hari ini. Lihat ke mana ia akan tumbuh.`,
    readingTime: 4,
    category: "literature",
  },
  {
    id: "shadows-we-carry",
    title: "Shadows We Carry",
    date: "2025-06-20",
    tags: ["Shadow", "Self", "Integration"],
    excerpt: "Bayangan bukan musuh; ia adalah bagian dari keseluruhan yang utuh.",
    content: `Bayangan bukan musuh; ia adalah bagian dari keseluruhan yang utuh. Carl Jung mengajarkan bahwa apa yang kita tekan ke dalam ketidaksadaran tidak hilang—ia hanya menjadi bayangan yang mengikuti kita.

Kita semua membawa bayangan: aspek diri yang tidak kita akui, kualitas yang kita proyeksikan ke orang lain. Mengintegrasikan bayangan bukan tentang menjadi "gelap," tetapi tentang menjadi utuh.

Dalam budaya yang merayakan positivity toksik, mengakui bayangan adalah tindakan berani. Ini berarti menghadapi ketidaknyamanan, duduk dengan emosi yang tidak enak, mengakui kompleksitas manusia.

Tetapi di sisi lain integrasi ada kebebasan. Ketika kita tidak lagi berlari dari bagian diri sendiri, energi yang terbuang untuk represi dapat dialihkan ke kreativitas dan pertumbuhan.

Lihatlah bayanganmu hari ini. Apa yang ia coba beritahukan?`,
    readingTime: 4,
    category: "reflection",
  },
  {
    id: "threshold-moments",
    title: "Threshold Moments",
    date: "2025-06-25",
    tags: ["Transition", "Liminality", "Change"],
    excerpt: "Di ambang pintu antara dua dunia, transformasi menjadi mungkin.",
    content: `Di ambang pintu antara dua dunia, transformasi menjadi mungkin. Antropolog menyebutnya "liminal space"—zona antara yang lama dan yang baru.

Kita mengalami momen-momen ambang ini sepanjang hidup: saat-saat sebelum keputusan besar, transisi antara fase kehidupan, jam-jam sepi antara malam dan pagi.

Di ruang-ruang ini, aturan normal tidak berlaku. Identitas menjadi cair. Yang tidak mungkin menjadi mungkin.

Budaya modern sering terburu-buru melewati liminalitas. Kita ingin kepastian, definisi yang jelas, jawaban yang pasti. Tetapi ada kebijaksanaan dalam tinggal sejenak di ambang pintu.

Di sana, dalam ketidakpastian, kita menemukan fleksibilitas untuk menjadi versi diri yang tidak pernah kita bayangkan sebelumnya.

Jangan terburu-buru melewati transisi. Biarkan dirimu berada di antara.`,
    readingTime: 4,
    category: "philosophy",
  },
];

async function main() {
  console.log("🌱 Seeding writings to database...\n");

  // Create admin user first
  const adminEmail = process.env.ADMIN_EMAIL || "juanmaulana29@gmail.com";
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        role: "ADMIN",
      },
    });
    console.log("✅ Created admin user");
  }

  // Create categories
  const categories = [
    { name: "Reflection", slug: "reflection", description: "Contemplative writings about life and experience" },
    { name: "Technology", slug: "technology", description: "Thoughts on digital life and coding" },
    { name: "Poetry", slug: "poetry", description: "Poetic expressions and verse" },
    { name: "Philosophy", slug: "philosophy", description: "Philosophical musings and questions" },
    { name: "Mindfulness", slug: "mindfulness", description: "Practices of presence and awareness" },
    { name: "Literature", slug: "literature", description: "On reading and writing" },
    { name: "Design", slug: "design", description: "Visual thinking and aesthetics" },
  ];

  for (const cat of categories) {
    await prisma.collection.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    });
  }
  console.log(`✅ Created ${categories.length} collections (categories)`);

  // Seed each writing
  let created = 0;
  let skipped = 0;
  
  for (const writing of writings) {
    // Create or connect tags
    const tagConnections = [];
    for (const tagName of writing.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagName.toLowerCase() },
        update: {},
        create: {
          name: tagName,
          slug: tagName.toLowerCase(),
        },
      });
      tagConnections.push({ tagId: tag.id });
    }

    // Find collection if category is specified
    let collectionId: string | undefined;
    if (writing.category) {
      const collection = await prisma.collection.findUnique({
        where: { slug: writing.category },
      });
      if (collection) {
        collectionId = collection.id;
      }
    }

    // Create writing
    const existingWriting = await prisma.writing.findUnique({
      where: { slug: writing.id },
    });

    if (existingWriting) {
      skipped++;
      continue;
    }

    await prisma.writing.create({
      data: {
        title: writing.title,
        slug: writing.id,
        content: writing.content,
        excerpt: writing.excerpt,
        status: "PUBLISHED",
        publishedAt: new Date(writing.date),
        authorId: adminUser.id,
        readingTime: writing.readingTime || 2,
        ...(collectionId && { collectionId }),
        tags: {
          create: tagConnections,
        },
      },
    });

    created++;
    console.log(`✅ Created "${writing.title}"`);
  }

  if (skipped > 0) {
    console.log(`⏭️  Skipped ${skipped} existing writings`);
  }

  console.log("\n🎉 Seeding complete!");

  // Print stats
  const writingsCount = await prisma.writing.count();
  const tagsCount = await prisma.tag.count();
  const collectionsCount = await prisma.collection.count();
  console.log(`   📝 ${writingsCount} writings`);
  console.log(`   🏷️  ${tagsCount} tags`);
  console.log(`   📁 ${collectionsCount} collections`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
