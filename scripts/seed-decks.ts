import { init, id } from "@instantdb/admin";
import schema from "../src/instant.schema";

const appId = process.env.VITE_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!appId || !adminToken) {
  console.error(
    "Missing VITE_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN environment variables.",
  );
  process.exit(1);
}

const db = init({ appId, adminToken, schema });

const BUILT_IN_DECKS = [
  {
    title: "General Trivia",
    description: "A mix of fun facts for any squad.",
    questions: [
      {
        text: "What planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctIndex: 1,
      },
      {
        text: "How many continents are there on Earth?",
        options: ["5", "6", "7", "8"],
        correctIndex: 2,
      },
      {
        text: "Which animal is the largest mammal?",
        options: ["Elephant", "Blue whale", "Giraffe", "Polar bear"],
        correctIndex: 1,
      },
      {
        text: "What is the capital of Japan?",
        options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
        correctIndex: 2,
      },
      {
        text: "Which gas do plants absorb from the atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
        correctIndex: 2,
      },
      {
        text: "How many sides does a hexagon have?",
        options: ["5", "6", "7", "8"],
        correctIndex: 1,
      },
      {
        text: "Which instrument has 88 keys?",
        options: ["Guitar", "Violin", "Piano", "Flute"],
        correctIndex: 2,
      },
      {
        text: "What is the hardest natural substance?",
        options: ["Gold", "Iron", "Diamond", "Quartz"],
        correctIndex: 2,
      },
      {
        text: "Which ocean is the largest?",
        options: ["Atlantic", "Indian", "Arctic", "Pacific"],
        correctIndex: 3,
      },
      {
        text: "How many days are in a leap year?",
        options: ["364", "365", "366", "367"],
        correctIndex: 2,
      },
    ],
  },
  {
    title: "Science Squad",
    description: "Cooperative science questions for curious teams.",
    questions: [
      {
        text: "What is the chemical symbol for water?",
        options: ["O2", "CO2", "H2O", "NaCl"],
        correctIndex: 2,
      },
      {
        text: "What force keeps us on the ground?",
        options: ["Magnetism", "Friction", "Gravity", "Inertia"],
        correctIndex: 2,
      },
      {
        text: "Which part of the cell contains DNA?",
        options: ["Membrane", "Nucleus", "Cytoplasm", "Ribosome"],
        correctIndex: 1,
      },
      {
        text: "What is the speed of light approximately?",
        options: [
          "300,000 km/s",
          "3,000 km/s",
          "30,000 km/s",
          "3,000,000 km/s",
        ],
        correctIndex: 0,
      },
      {
        text: "Which planet is closest to the Sun?",
        options: ["Venus", "Earth", "Mercury", "Mars"],
        correctIndex: 2,
      },
      {
        text: "What type of energy comes from the Sun?",
        options: ["Nuclear", "Solar", "Geothermal", "Kinetic"],
        correctIndex: 1,
      },
      {
        text: "What gas do humans need to breathe?",
        options: ["Carbon dioxide", "Helium", "Oxygen", "Methane"],
        correctIndex: 2,
      },
      {
        text: "Which scientist developed the theory of relativity?",
        options: ["Newton", "Einstein", "Galileo", "Tesla"],
        correctIndex: 1,
      },
      {
        text: "What is the center of an atom called?",
        options: ["Electron", "Proton", "Nucleus", "Neutron"],
        correctIndex: 2,
      },
      {
        text: "Which organ pumps blood through the body?",
        options: ["Lungs", "Brain", "Heart", "Liver"],
        correctIndex: 2,
      },
    ],
  },
  {
    title: "Geography Quest",
    description: "Travel the world together with these geography questions.",
    questions: [
      {
        text: "What is the capital of France?",
        options: ["Lyon", "Paris", "Marseille", "Nice"],
        correctIndex: 1,
      },
      {
        text: "Which country has the largest population?",
        options: ["USA", "India", "China", "Brazil"],
        correctIndex: 1,
      },
      {
        text: "The Nile River flows through which continent?",
        options: ["Asia", "Europe", "Africa", "South America"],
        correctIndex: 2,
      },
      {
        text: "What is the smallest country in the world?",
        options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
        correctIndex: 1,
      },
      {
        text: "Which mountain is the tallest on Earth?",
        options: ["K2", "Kangchenjunga", "Mount Everest", "Makalu"],
        correctIndex: 2,
      },
      {
        text: "What country is home to the kangaroo?",
        options: ["New Zealand", "Australia", "South Africa", "Indonesia"],
        correctIndex: 1,
      },
      {
        text: "Which desert is the largest hot desert?",
        options: ["Gobi", "Sahara", "Kalahari", "Arabian"],
        correctIndex: 1,
      },
      {
        text: "What is the capital of Canada?",
        options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
        correctIndex: 2,
      },
      {
        text: "Which sea separates Europe and Africa?",
        options: ["Red Sea", "Black Sea", "Mediterranean Sea", "Caspian Sea"],
        correctIndex: 2,
      },
      {
        text: "Which country has the most time zones?",
        options: ["Russia", "USA", "China", "Canada"],
        correctIndex: 0,
      },
    ],
  },
];

async function seed() {
  const data = await db.query({
    decks: {
      $: { where: { isBuiltIn: true } },
    },
  });

  if (data.decks.length > 0) {
    console.log(
      `Skipping seed — ${data.decks.length} built-in deck(s) already exist.`,
    );
    return;
  }

  const txes = BUILT_IN_DECKS.flatMap((deck) => {
    const deckId = id();
    const deckTx = db.tx.decks[deckId].update({
      title: deck.title,
      description: deck.description,
      isBuiltIn: true,
      createdAt: Date.now(),
      answerShuffleMode: "eachRepetition",
      questionShuffleMode: "eachRepetition",
      answerShuffleScope: "everyone",
      questionShuffleScope: "everyone",
      questionTimeSeconds: 20,
    });

    const questionTxes = deck.questions.map((question, index) => {
      const questionId = id();
      return db.tx.questions[questionId]
        .update({
          text: question.text,
          options: question.options,
          correctIndex: question.correctIndex,
          order: index,
          questionType: "mc",
        })
        .link({ deck: deckId });
    });

    return [deckTx, ...questionTxes];
  });

  await db.transact(txes);
  console.log(`Seeded ${BUILT_IN_DECKS.length} built-in decks.`);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
