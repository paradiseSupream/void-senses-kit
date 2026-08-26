import type { IqItem } from "@/lib/quiz-engine";

/**
 * 64-item IQ bank across five reasoning categories and three difficulty tiers.
 * A session draws 4 per category (20 items), so two runs almost never overlap.
 */
export const IQ_BANK: IqItem[] = [
  // ---------------- Number ----------------
  { id: "n1", cat: "Number", tier: 1, prompt: "2, 4, 8, 16, ?", options: ["24", "32", "20", "64"], answer: 1 },
  { id: "n2", cat: "Number", tier: 1, prompt: "5, 10, 20, 40, ?", options: ["60", "70", "80", "100"], answer: 2 },
  { id: "n3", cat: "Number", tier: 1, prompt: "1, 4, 9, 16, 25, ?", options: ["30", "34", "36", "49"], answer: 2 },
  { id: "n4", cat: "Number", tier: 1, prompt: "2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "36"], answer: 1 },
  { id: "n5", cat: "Number", tier: 1, prompt: "144 ÷ 12 × 3 = ?", options: ["4", "36", "48", "12"], answer: 1 },
  { id: "n6", cat: "Number", tier: 2, prompt: "3, 6, 11, 18, ?", options: ["27", "24", "29", "25"], answer: 0 },
  { id: "n7", cat: "Number", tier: 2, prompt: "1, 1, 2, 3, 5, 8, ?", options: ["11", "12", "13", "15"], answer: 2 },
  { id: "n8", cat: "Number", tier: 2, prompt: "100, 81, 64, 49, ?", options: ["36", "38", "32", "25"], answer: 0 },
  { id: "n9", cat: "Number", tier: 2, prompt: "7, 14, 28, 56, ?", options: ["96", "104", "112", "120"], answer: 2 },
  { id: "n10", cat: "Number", tier: 2, prompt: "81, 27, 9, 3, ?", options: ["0", "1", "2", "3"], answer: 1 },
  { id: "n11", cat: "Number", tier: 2, prompt: "Half of a third of 90 is:", options: ["10", "15", "18", "30"], answer: 1 },
  { id: "n12", cat: "Number", tier: 3, prompt: "12, 10, 13, 11, 14, ?", options: ["12", "15", "16", "10"], answer: 0 },
  { id: "n13", cat: "Number", tier: 3, prompt: "1, 8, 27, 64, ?", options: ["100", "121", "125", "144"], answer: 2 },
  { id: "n14", cat: "Number", tier: 3, prompt: "6, 12, 10, 20, 18, ?", options: ["24", "30", "36", "26"], answer: 2 },
  { id: "n15", cat: "Number", tier: 3, prompt: "2, 3, 5, 7, 11, ?", options: ["12", "13", "14", "15"], answer: 1 },

  // ---------------- Logic ----------------
  { id: "l1", cat: "Logic", tier: 1, prompt: "20% of 250 is:", options: ["25", "40", "50", "60"], answer: 2 },
  { id: "l2", cat: "Logic", tier: 1, prompt: "The average of 4, 8, 12 and 16 is:", options: ["8", "10", "12", "14"], answer: 1 },
  { id: "l3", cat: "Logic", tier: 1, prompt: "A train travels 60 km/h. How far in 1 hour 30 minutes?", options: ["75 km", "80 km", "90 km", "120 km"], answer: 2 },
  { id: "l4", cat: "Logic", tier: 1, prompt: "A shirt costs $40 after a 20% discount. Original price:", options: ["$48", "$50", "$52", "$45"], answer: 1 },
  { id: "l5", cat: "Logic", tier: 2, prompt: "If 5 machines make 5 units in 5 minutes, 100 machines make 100 units in:", options: ["5 min", "20 min", "100 min", "1 min"], answer: 0 },
  { id: "l6", cat: "Logic", tier: 2, prompt: "3 painters paint 3 rooms in 3 hours. 9 painters paint 9 rooms in:", options: ["1 hour", "3 hours", "9 hours", "27 hours"], answer: 1 },
  { id: "l7", cat: "Logic", tier: 2, prompt: "All Bloops are Razzies. All Razzies are Lazzies. Therefore:", options: ["All Bloops are Lazzies", "All Lazzies are Bloops", "No Bloops are Lazzies", "Cannot be determined"], answer: 0 },
  { id: "l8", cat: "Logic", tier: 2, prompt: "Today is Wednesday. What day is it 100 days from now?", options: ["Thursday", "Friday", "Saturday", "Sunday"], answer: 1 },
  { id: "l9", cat: "Logic", tier: 2, prompt: "A book and a pen cost $12 together. The book costs $10 more than the pen. The pen costs:", options: ["$1", "$2", "$1.50", "$0.50"], answer: 0 },
  { id: "l10", cat: "Logic", tier: 3, prompt: "A bat and a ball cost $1.10. The bat costs $1.00 more than the ball. The ball costs:", options: ["$0.10", "$0.05", "$0.01", "$0.15"], answer: 1 },
  { id: "l11", cat: "Logic", tier: 3, prompt: "A lily patch doubles daily and covers the lake on day 48. It covered half the lake on day:", options: ["24", "36", "46", "47"], answer: 3 },
  { id: "l12", cat: "Logic", tier: 3, prompt: "Some artists are engineers. All engineers are analysts. Which must be true?", options: ["Some artists are analysts", "All artists are analysts", "No analyst is an artist", "All analysts are engineers"], answer: 0 },
  { id: "l13", cat: "Logic", tier: 3, prompt: "In a race you overtake the runner in second place. You are now in:", options: ["First", "Second", "Third", "Last"], answer: 1 },

  // ---------------- Verbal ----------------
  { id: "v1", cat: "Verbal", tier: 1, prompt: "Doctor is to hospital as teacher is to:", options: ["Student", "School", "Book", "Lesson"], answer: 1 },
  { id: "v2", cat: "Verbal", tier: 1, prompt: "Which does not belong? Rose, Tulip, Oak, Daisy", options: ["Rose", "Tulip", "Oak", "Daisy"], answer: 2 },
  { id: "v3", cat: "Verbal", tier: 1, prompt: "Hand is to glove as foot is to:", options: ["Shoe", "Sock", "Toe", "Leg"], answer: 1 },
  { id: "v4", cat: "Verbal", tier: 1, prompt: "Which does not belong? Apple, Banana, Carrot, Grape", options: ["Apple", "Banana", "Carrot", "Grape"], answer: 2 },
  { id: "v5", cat: "Verbal", tier: 2, prompt: "“Meticulous” most nearly means:", options: ["Careless", "Extremely careful", "Impatient", "Generous"], answer: 1 },
  { id: "v6", cat: "Verbal", tier: 2, prompt: "The opposite of “abundant” is:", options: ["Plentiful", "Scarce", "Heavy", "Common"], answer: 1 },
  { id: "v7", cat: "Verbal", tier: 2, prompt: "Book is to chapter as song is to:", options: ["Album", "Verse", "Singer", "Radio"], answer: 1 },
  { id: "v8", cat: "Verbal", tier: 2, prompt: "Whale is to mammal as shark is to:", options: ["Fish", "Reptile", "Bird", "Amphibian"], answer: 0 },
  { id: "v9", cat: "Verbal", tier: 2, prompt: "“Ephemeral” most nearly means:", options: ["Permanent", "Fleeting", "Massive", "Hidden"], answer: 1 },
  { id: "v10", cat: "Verbal", tier: 3, prompt: "The opposite of “candid” is:", options: ["Honest", "Secretive", "Cheerful", "Direct"], answer: 1 },
  { id: "v11", cat: "Verbal", tier: 3, prompt: "“Pragmatic” most nearly means:", options: ["Practical", "Emotional", "Theoretical", "Reckless"], answer: 0 },
  { id: "v12", cat: "Verbal", tier: 3, prompt: "Drought is to water as famine is to:", options: ["Land", "Food", "Rain", "Money"], answer: 1 },
  { id: "v13", cat: "Verbal", tier: 3, prompt: "“Obsolete” most nearly means:", options: ["Out of date", "Expensive", "Fragile", "Essential"], answer: 0 },

  // ---------------- Pattern ----------------
  { id: "p1", cat: "Pattern", tier: 1, prompt: "△ ○ △ ○ △ ?", options: ["△", "○", "□", "◇"], answer: 1 },
  { id: "p2", cat: "Pattern", tier: 1, prompt: "■□■□ | □■□■ | ■□■□ | ?", options: ["■□■□", "□■□■", "■■□□", "□□■■"], answer: 1 },
  { id: "p3", cat: "Pattern", tier: 1, prompt: "▲ ▶ ▼ ◀ ?", options: ["▲", "▶", "▼", "◀"], answer: 0 },
  { id: "p4", cat: "Pattern", tier: 1, prompt: "1 A 2 B 3 ?", options: ["C", "D", "4", "B"], answer: 0 },
  { id: "p5", cat: "Pattern", tier: 2, prompt: "A ▸ C ▸ F ▸ J ▸ ?", options: ["M", "N", "O", "P"], answer: 2 },
  { id: "p6", cat: "Pattern", tier: 2, prompt: "Z ▸ W ▸ T ▸ Q ▸ ?", options: ["N", "M", "O", "P"], answer: 0 },
  { id: "p7", cat: "Pattern", tier: 2, prompt: "AB ▸ DE ▸ GH ▸ ?", options: ["IJ", "JK", "KL", "HI"], answer: 1 },
  { id: "p8", cat: "Pattern", tier: 2, prompt: "◐ ◓ ◑ ◒ ?", options: ["◐", "◑", "◒", "◓"], answer: 0 },
  { id: "p9", cat: "Pattern", tier: 2, prompt: "F ▸ I ▸ L ▸ O ▸ ?", options: ["Q", "R", "S", "P"], answer: 1 },
  { id: "p10", cat: "Pattern", tier: 3, prompt: "AZ ▸ BY ▸ CX ▸ ?", options: ["DV", "DW", "EW", "DX"], answer: 1 },
  { id: "p11", cat: "Pattern", tier: 3, prompt: "B ▸ D ▸ G ▸ K ▸ ?", options: ["N", "O", "P", "Q"], answer: 2 },
  { id: "p12", cat: "Pattern", tier: 3, prompt: "2A ▸ 4C ▸ 8E ▸ 16?", options: ["F", "G", "H", "I"], answer: 1 },
  { id: "p13", cat: "Pattern", tier: 3, prompt: "◆◇◇ ▸ ◇◆◇ ▸ ◇◇◆ ▸ ?", options: ["◆◇◇", "◇◆◇", "◇◇◆", "◆◆◇"], answer: 0 },

  // ---------------- Spatial ----------------
  { id: "s1", cat: "Spatial", tier: 1, prompt: "How many faces does a cube have?", options: ["4", "6", "8", "12"], answer: 1 },
  { id: "s2", cat: "Spatial", tier: 1, prompt: "A cylinder viewed directly from above looks like a:", options: ["Square", "Circle", "Triangle", "Rectangle"], answer: 1 },
  { id: "s3", cat: "Spatial", tier: 1, prompt: "Which shape has the most sides?", options: ["Hexagon", "Pentagon", "Octagon", "Square"], answer: 2 },
  { id: "s4", cat: "Spatial", tier: 1, prompt: "The interior angles of a triangle add up to:", options: ["90°", "180°", "270°", "360°"], answer: 1 },
  { id: "s5", cat: "Spatial", tier: 2, prompt: "How many edges does a cube have?", options: ["8", "10", "12", "16"], answer: 2 },
  { id: "s6", cat: "Spatial", tier: 2, prompt: "How many vertices does a cube have?", options: ["6", "8", "10", "12"], answer: 1 },
  { id: "s7", cat: "Spatial", tier: 2, prompt: "A 3D shape with one circular base and a single apex is a:", options: ["Cylinder", "Cone", "Sphere", "Prism"], answer: 1 },
  { id: "s8", cat: "Spatial", tier: 2, prompt: "The digit 6 rotated 180° becomes:", options: ["9", "0", "8", "6"], answer: 0 },
  { id: "s9", cat: "Spatial", tier: 2, prompt: "Cube is to square as sphere is to:", options: ["Circle", "Cylinder", "Line", "Cone"], answer: 0 },
  { id: "s10", cat: "Spatial", tier: 3, prompt: "If ◧ rotates 90° clockwise twice, it becomes:", options: ["◨", "◧", "◩", "◪"], answer: 0 },
  { id: "s11", cat: "Spatial", tier: 3, prompt: "How many faces does a triangular prism have?", options: ["4", "5", "6", "8"], answer: 1 },
  { id: "s12", cat: "Spatial", tier: 3, prompt: "The mirror image of the letter “b” is:", options: ["d", "p", "q", "b"], answer: 0 },
  { id: "s13", cat: "Spatial", tier: 3, prompt: "A square rotated 45° in the plane looks like a:", options: ["Rectangle", "Diamond", "Trapezoid", "Circle"], answer: 1 },
];

export const IQ_PER_CATEGORY = 5;
export const IQ_SESSION_SIZE = IQ_PER_CATEGORY * 5;
