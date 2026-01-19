import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Data from writings.ts
const writings = [
  {
    id: "memory-of-rain",
    title: "Memory of Rain",
    date: "2024-09-12",
    tags: ["Memory", "Silence", "Ritual"],
    excerpt:
      "Hujan turun seperti arsip yang hidup, menyalin ulang kenangan di permukaan kota.",
    content:
      "Hujan turun seperti arsip yang hidup, menyalin ulang kenangan di permukaan kota. Aku berjalan perlahan, menghafal pola tetes yang menyentuh genteng dan aspal. Di antara suara itu, ada jeda-jeda kecil yang menenangkan. Namun di balik ketenangan, ada pertanyaan yang menunggu: apa yang ingin kita simpan, dan apa yang ingin kita lepaskan?",
  },
  {
    id: "quiet-algorithms",
    title: "Quiet Algorithms",
    date: "2024-10-02",
    tags: ["Algorithm", "Breath", "Focus"],
    excerpt:
      "Algoritma tak selalu berisik; kadang ia bekerja seperti napas yang teratur.",
    content:
      "Algoritma tak selalu berisik; kadang ia bekerja seperti napas yang teratur. Setiap baris kode adalah upaya kecil untuk menata kekacauan. Tetapi saat perhatian kita retak, pola itu ikut kabur. Di situlah sunyi menjadi struktur, bukan kekosongan.",
  },
  {
    id: "fragments-of-dawn",
    title: "Fragments of Dawn",
    date: "2024-11-14",
    tags: ["Dawn", "Hope", "Light"],
    excerpt:
      "Pagi menyapu sisa gelap, menyisakan fragmen cahaya yang jujur.",
    content:
      "Pagi menyapu sisa gelap, menyisakan fragmen cahaya yang jujur. Meski begitu, hari tidak selalu ramah. Ada detik-detik ketika kita harus memilih: bertahan atau membiarkan diri terbit lagi. Di sana, harapan bukan janji, melainkan kebiasaan kecil.",
  },
  {
    id: "ink-and-orbit",
    title: "Ink & Orbit",
    date: "2024-12-01",
    tags: ["Orbit", "Language", "Gravity"],
    excerpt:
      "Tulisan bergerak seperti planet, mengitari makna yang tak selalu terlihat.",
    content:
      "Tulisan bergerak seperti planet, mengitari makna yang tak selalu terlihat. Ada gravitasi halus yang membuat kita kembali pada kata-kata tertentu. Namun orbit tak pernah benar-benar sama; ia adalah variasi dari rindu pada pusat yang sama.",
  },
  {
    id: "blue-silence",
    title: "Blue Silence",
    date: "2025-01-19",
    tags: ["Silence", "Blue", "Reflection"],
    excerpt: "Kesunyian biru menyimpan gema yang paling jujur.",
    content:
      "Kesunyian biru menyimpan gema yang paling jujur. Kadang kita takut pada hening karena ia memperlihatkan diri kita tanpa distraksi. Tetapi dari situ, muncul pengertian baru: sunyi bukan lawan suara, ia adalah ruang bagi makna.",
  },
  {
    id: "breathing-letters",
    title: "Breathing Letters",
    date: "2025-02-05",
    tags: ["Breath", "Language", "Ritual"],
    excerpt: "Huruf-huruf bernapas, menjadikan bacaan sebagai ritual harian.",
    content:
      "Huruf-huruf bernapas, menjadikan bacaan sebagai ritual harian. Saat kita membaca dengan pelan, ada ritme yang menuntun pikiran untuk tinggal lebih lama. Walau sederhana, ritme itu menyalakan rasa ingin tahu yang baru.",
  },
  {
    id: "fractal-letters",
    title: "Fractal Letters",
    date: "2025-03-02",
    tags: ["Fractal", "Pattern", "Mind"],
    excerpt:
      "Pola-pola kecil membentuk semesta makna yang berulang dan bertumbuh.",
    content:
      "Pola-pola kecil membentuk semesta makna yang berulang dan bertumbuh. Seperti fractal, satu kalimat dapat memantulkan keseluruhan gagasan. Namun ketika kita membaca ulang, sudut pandang ikut berubah.",
  },
  {
    id: "dawn-of-quiet",
    title: "Dawn of Quiet",
    date: "2025-04-11",
    tags: ["Dawn", "Silence", "Focus"],
    excerpt: "Subuh membawa kesunyian yang memusatkan pikiran.",
    content:
      "Subuh membawa kesunyian yang memusatkan pikiran. Tidak ada keramaian, hanya suara langkah sendiri. Tetapi di sana, ide-ide menemukan ritme. Seolah pagi mengajarkan: fokus adalah bentuk kasih pada diri sendiri.",
  },
  {
    id: "memory-ribbon",
    title: "Memory Ribbon",
    date: "2025-05-01",
    tags: ["Memory", "Thread", "Bloom"],
    excerpt: "Jejak kecil mengikat fragmen pengalaman menjadi pita ingatan.",
    content:
      "Jejak kecil mengikat fragmen pengalaman menjadi pita ingatan. Kita sering lupa, tetapi tubuh menyimpan pola. Meski samar, pola itu dapat menuntun kita kembali ke awal.",
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

  // Seed each writing
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

    // Create writing
    const existingWriting = await prisma.writing.findUnique({
      where: { slug: writing.id },
    });

    if (existingWriting) {
      console.log(`⏭️  Skipping "${writing.title}" (already exists)`);
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
        tags: {
          create: tagConnections,
        },
      },
    });

    console.log(`✅ Created "${writing.title}"`);
  }

  console.log("\n🎉 Seeding complete!");

  // Print stats
  const writingsCount = await prisma.writing.count();
  const tagsCount = await prisma.tag.count();
  console.log(`   📝 ${writingsCount} writings`);
  console.log(`   🏷️  ${tagsCount} tags`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
