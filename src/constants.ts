export const NCTB_CURRICULUM = {
  Physics: [
    // 1st Paper
    "Physics 1st: Physical World and Measurement",
    "Physics 1st: Vector",
    "Physics 1st: Newtonian Mechanics",
    "Physics 1st: Work, Energy and Power",
    "Physics 1st: Gravitation and Gravity",
    "Physics 1st: Structural Properties of Matter",
    "Physics 1st: Periodic Motion",
    "Physics 1st: Waves",
    "Physics 1st: Ideal Gas and Kinetics of Gas",
    // 2nd Paper
    "Physics 2nd: Thermodynamics",
    "Physics 2nd: Static Electricity",
    "Physics 2nd: Current Electricity",
    "Physics 2nd: Magnetic Effects of Current and Magnetism",
    "Physics 2nd: Electromagnetic Induction and Alternating Current",
    "Physics 2nd: Geometrical Optics",
    "Physics 2nd: Physical Optics",
    "Physics 2nd: Introduction to Modern Physics",
    "Physics 2nd: Atomic Model and Nuclear Physics",
    "Physics 2nd: Semiconductor and Electronics",
    "Physics 2nd: Astronomy"
  ],
  Chemistry: [
    // 1st Paper
    "Chemistry 1st: Safe Use of Laboratory",
    "Chemistry 1st: Qualitative Chemistry",
    "Chemistry 1st: Periodic Properties of Elements and Chemical Bonding",
    "Chemistry 1st: Chemical Change",
    "Chemistry 1st: Working Chemistry",
    // 2nd Paper
    "Chemistry 2nd: Environmental Chemistry",
    "Chemistry 2nd: Organic Chemistry",
    "Chemistry 2nd: Quantitative Chemistry",
    "Chemistry 2nd: Electrochemistry",
    "Chemistry 2nd: Economic Chemistry"
  ],
  Mathematics: [
    // 1st Paper
    "Math 1st: Matrices and Determinants",
    "Math 1st: Vectors",
    "Math 1st: Straight Lines",
    "Math 1st: Circle",
    "Math 1st: Permutations and Combinations",
    "Math 1st: Trigonometric Ratios",
    "Math 1st: Inverse Trigonometric Functions and Trigonometric Equations",
    "Math 1st: Functions and Graphs of Functions",
    "Math 1st: Differentiation",
    "Math 1st: Integration",
    // 2nd Paper
    "Math 2nd: Real Numbers and Inequalities",
    "Math 2nd: Linear Programming",
    "Math 2nd: Complex Numbers",
    "Math 2nd: Polynomials and Polynomial Equations",
    "Math 2nd: Binomial Expansion",
    "Math 2nd: Conics",
    "Math 2nd: Inverse Trigonometric Functions and Trigonometric Equations",
    "Math 2nd: Statics",
    "Math 2nd: Dynamics",
    "Math 2nd: Probability"
  ]
};

export const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'] as const;

export const PAPER_FINALS = [
  'Physics 1st Paper',
  'Physics 2nd Paper',
  'Chemistry 1st Paper',
  'Chemistry 2nd Paper',
  'Math 1st Paper',
  'Math 2nd Paper'
] as const;

export const SUBJECT_FINALS = [
  'Physics Final',
  'Chemistry Final',
  'Math Final'
] as const;

export const MOCK_TESTS = [
  'GST Full Mock Test'
] as const;

export const EXAM_TYPES = ['V.QB', 'GST QB', 'PH EXAM', 'Paper Final', 'Subject Final', 'Full Mock'] as const;
