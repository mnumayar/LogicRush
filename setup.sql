-- ============================================================
-- LogicRush — Full Database Setup
-- Run this in the Supabase SQL Editor (once, top-to-bottom)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid references auth.users primary key,
  username    text unique not null,
  created_at  timestamptz default now()
);

create table if not exists questions (
  id           uuid primary key default gen_random_uuid(),
  category     text check (category in ('math', 'logic')) not null,
  difficulty   text check (difficulty in ('easy', 'medium', 'hard')) not null default 'medium',
  prompt       text not null,
  choices      jsonb not null,
  answer       text not null,
  explanation  text not null,
  created_at   timestamptz default now()
);

create table if not exists scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  category    text check (category in ('math', 'logic')) not null,
  score       int not null,
  created_at  timestamptz default now()
);


-- ────────────────────────────────────────────────────────────
-- 2. LEADERBOARD VIEW
-- ────────────────────────────────────────────────────────────

create or replace view leaderboard as
  select
    p.username,
    s.category,
    max(s.score) as high_score,
    rank() over (partition by s.category order by max(s.score) desc) as rank
  from scores s
  join profiles p on p.id = s.user_id
  group by p.username, s.category;


-- ────────────────────────────────────────────────────────────
-- 3. SCORE CEILING TRIGGER (cheat prevention)
-- ────────────────────────────────────────────────────────────

create or replace function validate_score()
returns trigger as $$
begin
  if NEW.score > 500 then
    raise exception 'Score exceeds maximum allowed value';
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists check_score_ceiling on scores;
create trigger check_score_ceiling
  before insert on scores
  for each row execute function validate_score();


-- ────────────────────────────────────────────────────────────
-- 4. ROW-LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table profiles  enable row level security;
alter table questions enable row level security;
alter table scores    enable row level security;

drop policy if exists "profiles_read_all"   on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "questions_read_all"  on questions;
drop policy if exists "scores_insert_own"   on scores;
drop policy if exists "scores_read_all"     on scores;

create policy "profiles_read_all"
  on profiles for select using (true);

create policy "profiles_insert_own"
  on profiles for insert with check (id = auth.uid());

create policy "profiles_update_own"
  on profiles for update using (id = auth.uid());

create policy "questions_read_all"
  on questions for select using (true);

create policy "scores_insert_own"
  on scores for insert with check (user_id = auth.uid());

create policy "scores_read_all"
  on scores for select using (true);


-- ────────────────────────────────────────────────────────────
-- 5. SEED DATA — 50 Math Questions
-- ────────────────────────────────────────────────────────────

insert into questions (category, difficulty, prompt, choices, answer, explanation) values

('math','medium','What is 17 × 8?',
 '["126","136","144","156"]','136',
 '17 × 8 = (10 × 8) + (7 × 8) = 80 + 56 = 136.'),

('math','medium','What is 144 ÷ 12?',
 '["11","12","13","14"]','12',
 '144 ÷ 12 = 12 because 12 × 12 = 144.'),

('math','medium','What is 25% of 200?',
 '["25","40","50","75"]','50',
 '25% means one quarter. 200 ÷ 4 = 50.'),

('math','medium','What is 3² + 4²?',
 '["7","14","25","49"]','25',
 '3² = 9, 4² = 16. 9 + 16 = 25.'),

('math','medium','What is 15% of 80?',
 '["8","10","12","15"]','12',
 '10% of 80 = 8; 5% of 80 = 4. 8 + 4 = 12.'),

('math','medium','What is 7³?',
 '["49","147","343","441"]','343',
 '7³ = 7 × 7 × 7 = 49 × 7 = 343.'),

('math','medium','What is √225?',
 '["13","14","15","16"]','15',
 '15 × 15 = 225, so √225 = 15.'),

('math','medium','What is 1001 − 367?',
 '["624","634","644","654"]','634',
 '1001 − 367: borrow to get 1000 − 366 = 634.'),

('math','medium','What is 6! (6 factorial)?',
 '["120","360","720","5040"]','720',
 '6! = 6 × 5 × 4 × 3 × 2 × 1 = 720.'),

('math','medium','What is 40% of 150?',
 '["40","50","60","75"]','60',
 '40% of 150 = 0.4 × 150 = 60.'),

('math','medium','If 3x + 7 = 22, what is x?',
 '["3","4","5","6"]','5',
 '3x = 22 − 7 = 15, so x = 15 ÷ 3 = 5.'),

('math','medium','If 2x − 3 = 11, what is x?',
 '["5","6","7","8"]','7',
 '2x = 11 + 3 = 14, so x = 7.'),

('math','medium','What is the value of x if x/4 = 9?',
 '["27","32","36","40"]','36',
 'x = 9 × 4 = 36.'),

('math','medium','If y = 2x + 1 and x = 5, what is y?',
 '["9","10","11","12"]','11',
 'y = 2(5) + 1 = 10 + 1 = 11.'),

('math','medium','What is the slope of the line y = 3x − 4?',
 '["−4","1/3","3","4"]','3',
 'In y = mx + b, m is the slope. Here m = 3.'),

('math','medium','Expand (x + 3)². What is the constant term?',
 '["3","6","9","12"]','9',
 '(x + 3)² = x² + 6x + 9. The constant term is 9.'),

('math','medium','If a + b = 10 and a − b = 4, what is a?',
 '["3","5","7","8"]','7',
 'Adding the equations: 2a = 14, so a = 7.'),

('math','medium','What are the roots of x² − 5x + 6 = 0?',
 '["1 and 6","2 and 3","−2 and −3","3 and 4"]','2 and 3',
 'Factor: (x − 2)(x − 3) = 0, so x = 2 or x = 3.'),

('math','medium','Simplify: 2(3x + 4) − 3(x − 1)',
 '["3x + 11","5x + 5","3x + 5","6x + 5"]','3x + 11',
 '6x + 8 − 3x + 3 = 3x + 11.'),

('math','medium','If 5(x − 2) = 20, what is x?',
 '["4","5","6","7"]','6',
 'x − 2 = 4, so x = 6.'),

('math','medium','What is the next number? 2, 4, 8, 16, __',
 '["24","28","32","36"]','32',
 'Each term doubles. 16 × 2 = 32.'),

('math','medium','What is the missing number? 3, 6, 12, __, 48',
 '["18","20","24","30"]','24',
 'Each term doubles. 12 × 2 = 24.'),

('math','medium','What is the 10th term of the sequence 5, 10, 15, 20, …?',
 '["45","50","55","60"]','50',
 'Arithmetic sequence with d = 5. 10th term = 5 × 10 = 50.'),

('math','medium','What is the sum of the first 10 natural numbers?',
 '["45","50","55","60"]','55',
 'Sum = n(n+1)/2 = 10 × 11 / 2 = 55.'),

('math','medium','What comes next? 1, 1, 2, 3, 5, 8, __',
 '["11","12","13","15"]','13',
 'Fibonacci sequence: each term = sum of two preceding terms. 5 + 8 = 13.'),

('math','medium','Find the missing term: 100, 91, 82, __, 64',
 '["71","72","73","74"]','73',
 'The sequence decreases by 9 each time. 82 − 9 = 73.'),

('math','medium','What is the 5th term of 2, 6, 18, 54, …?',
 '["108","162","216","324"]','162',
 'Geometric sequence, ratio = 3. 5th term = 2 × 3⁴ = 2 × 81 = 162.'),

('math','medium','The sequence 4, 7, 10, 13 … What is the 20th term?',
 '["58","61","64","67"]','61',
 'a₁ = 4, d = 3. aₙ = 4 + (n−1)×3. a₂₀ = 4 + 57 = 61.'),

('math','medium','What is the sum of 1 + 3 + 5 + 7 + … + 19?',
 '["81","90","100","110"]','100',
 'Sum of first n odd numbers = n². There are 10 terms here, so sum = 10² = 100.'),

('math','medium','What is 2¹⁰?',
 '["512","1000","1024","2048"]','1024',
 '2¹⁰ = 1024. (2⁹ = 512, × 2 = 1024.)'),

('math','medium','A shirt costs $40 and is on sale for 25% off. What is the sale price?',
 '["$25","$28","$30","$35"]','$30',
 '25% of $40 = $10. $40 − $10 = $30.'),

('math','medium','A price increases from $50 to $65. What is the percentage increase?',
 '["20%","25%","30%","35%"]','30%',
 'Increase = $15. (15/50) × 100 = 30%.'),

('math','medium','If 3 out of every 12 items are defective, what percentage are defective?',
 '["20%","25%","30%","33%"]','25%',
 '3/12 = 1/4 = 25%.'),

('math','medium','A car travels 240 km on 20 litres of fuel. How many km per litre?',
 '["10","11","12","14"]','12',
 '240 ÷ 20 = 12 km/L.'),

('math','medium','What is 2/5 expressed as a percentage?',
 '["25%","35%","40%","45%"]','40%',
 '2 ÷ 5 = 0.4 = 40%.'),

('math','medium','If a:b = 3:4 and b = 28, what is a?',
 '["18","20","21","24"]','21',
 'a = (3/4) × 28 = 21.'),

('math','medium','A rectangle has length 12 and width 5. What is the area?',
 '["34","50","60","70"]','60',
 'Area = length × width = 12 × 5 = 60.'),

('math','medium','A circle has radius 7. What is the area? (Use π ≈ 22/7)',
 '["44","132","154","176"]','154',
 'A = πr² = (22/7) × 49 = 22 × 7 = 154.'),

('math','medium','What is the perimeter of a square with side 9?',
 '["27","32","36","45"]','36',
 'Perimeter = 4 × side = 4 × 9 = 36.'),

('math','medium','How many seconds are in 2.5 hours?',
 '["7200","8000","9000","10000"]','9000',
 '2.5 × 60 × 60 = 2.5 × 3600 = 9000.'),

('math','medium','The angles of a triangle are 45°, 75°, and x°. What is x?',
 '["50","55","60","65"]','60',
 'Angles in a triangle sum to 180°. x = 180 − 45 − 75 = 60.'),

('math','medium','What is the hypotenuse of a right triangle with legs 6 and 8?',
 '["9","10","11","12"]','10',
 '√(6² + 8²) = √(36 + 64) = √100 = 10.'),

('math','medium','How many degrees are in a straight line?',
 '["90","120","180","360"]','180',
 'A straight line (flat angle) = 180°.'),

('math','medium','What is the LCM of 4 and 6?',
 '["8","10","12","24"]','12',
 'Multiples of 4: 4,8,12… Multiples of 6: 6,12… LCM = 12.'),

('math','medium','What is the GCD of 48 and 36?',
 '["6","8","12","18"]','12',
 '48 = 2⁴×3; 36 = 2²×3². GCD = 2²×3 = 12.'),

('math','medium','What is the prime factorisation of 60?',
 '["2×3×10","2²×3×5","2³×3×5","4×3×5"]','2²×3×5',
 '60 = 4×15 = 4×3×5 = 2²×3×5.'),

('math','medium','A train travels at 90 km/h for 2.5 hours. How far does it travel?',
 '["200 km","215 km","225 km","250 km"]','225 km',
 'Distance = speed × time = 90 × 2.5 = 225 km.'),

('math','medium','Which of these is NOT a prime number?',
 '["11","13","17","21"]','21',
 '21 = 3 × 7, so it is composite, not prime.'),

('math','medium','If a = 4 and b = −3, what is a² + 2ab + b²?',
 '["1","7","25","49"]','1',
 'a² + 2ab + b² = (a+b)² = (4+(−3))² = 1² = 1.'),

('math','medium','What is 0.125 as a fraction?',
 '["1/4","1/6","1/8","1/10"]','1/8',
 '0.125 = 125/1000 = 1/8.'),

('math','medium','A bag has 3 red, 4 blue, and 5 green balls. What is the probability of picking a blue ball?',
 '["1/3","4/12","1/4","5/12"]','4/12',
 'P = 4 out of (3+4+5) = 4/12 = 1/3.');


-- ────────────────────────────────────────────────────────────
-- 6. SEED DATA — 50 Logic Questions
-- ────────────────────────────────────────────────────────────

insert into questions (category, difficulty, prompt, choices, answer, explanation) values

('logic','medium','All dogs are mammals. All mammals breathe air. Therefore:',
 '["Some dogs breathe air","All dogs breathe air","No dogs breathe air","Some mammals are dogs"]','All dogs breathe air',
 'Transitive syllogism: Dogs → Mammals → Breathe air, so all dogs breathe air.'),

('logic','medium','No fish can walk. All trout are fish. Therefore:',
 '["Some trout can walk","All trout can walk","No trout can walk","Trout may or may not walk"]','No trout can walk',
 'Since no fish can walk and all trout are fish, no trout can walk.'),

('logic','medium','All squares are rectangles. Shape X is a square. Therefore:',
 '["X may be a rectangle","X is definitely a rectangle","X is not a rectangle","Nothing can be concluded"]','X is definitely a rectangle',
 'Because all squares are rectangles and X is a square, X must be a rectangle.'),

('logic','medium','If it rains, the ground gets wet. The ground is not wet. Therefore:',
 '["It rained","It did not rain","It may have rained","The ground is dry for another reason"]','It did not rain',
 'Modus tollens: if P → Q and ¬Q, then ¬P. No wet ground means it did not rain.'),

('logic','medium','Some birds can swim. All penguins are birds. Therefore:',
 '["All penguins can swim","No penguins can swim","Some penguins might swim","Penguins are not birds"]','Some penguins might swim',
 '"Some birds swim" does not guarantee penguins are among them — so we can only say they might.'),

('logic','medium','Alice is taller than Bob. Bob is taller than Carol. Who is shortest?',
 '["Alice","Bob","Carol","Cannot be determined"]','Carol',
 'Alice > Bob > Carol, so Carol is shortest.'),

('logic','medium','All A are B. Some B are C. Can we conclude all A are C?',
 '["Yes, definitely","No, not necessarily","Yes, if C includes all B","Only if A equals B"]','No, not necessarily',
 '"Some B are C" does not cover all B, so the A that are B may not be in the C subset.'),

('logic','medium','Every student who passes the test gets a certificate. Mia did not get a certificate. Therefore:',
 '["Mia passed the test","Mia did not pass the test","Mia took the test","Nothing can be said"]','Mia did not pass the test',
 'Contrapositive: if no certificate, then did not pass.'),

('logic','medium','If today is Monday, tomorrow is Tuesday. Tomorrow is NOT Tuesday. Therefore:',
 '["Today is Monday","Today is not Monday","Today might be Monday","Tomorrow is Wednesday"]','Today is not Monday',
 'Modus tollens applied: ¬Tuesday tomorrow ⟹ ¬Monday today.'),

('logic','medium','All managers attend the Friday meeting. Sam does not attend the Friday meeting. Therefore:',
 '["Sam is a manager","Sam is not a manager","Sam attended another meeting","Nothing can be concluded"]','Sam is not a manager',
 'Contrapositive of "all managers attend" is "non-attendees are not managers."'),

('logic','medium','Which does NOT belong? Apple · Banana · Carrot · Mango',
 '["Apple","Banana","Carrot","Mango"]','Carrot',
 'Apple, Banana, and Mango are fruits. Carrot is a vegetable.'),

('logic','medium','Which does NOT belong? Piano · Guitar · Violin · Flute',
 '["Piano","Guitar","Violin","Flute"]','Piano',
 'Guitar, Violin, and Flute are portable/handheld instruments. Piano is a large keyboard instrument.'),

('logic','medium','Which does NOT belong? 4 · 9 · 15 · 25',
 '["4","9","15","25"]','15',
 '4, 9, and 25 are perfect squares (2², 3², 5²). 15 is not.'),

('logic','medium','Which does NOT belong? Mercury · Venus · Moon · Mars',
 '["Mercury","Venus","Moon","Mars"]','Moon',
 'Mercury, Venus, and Mars are planets. The Moon is a natural satellite.'),

('logic','medium','Which does NOT belong? 2 · 3 · 5 · 9',
 '["2","3","5","9"]','9',
 '2, 3, and 5 are prime numbers. 9 = 3 × 3 is composite.'),

('logic','medium','Which does NOT belong? Lion · Tiger · Leopard · Dolphin',
 '["Lion","Tiger","Leopard","Dolphin"]','Dolphin',
 'Lion, Tiger, and Leopard are big cats (felids). Dolphin is a marine mammal (cetacean).'),

('logic','medium','Which does NOT belong? Shirt · Trousers · Shoes · Jacket',
 '["Shirt","Trousers","Shoes","Jacket"]','Shoes',
 'Shirt, Trousers, and Jacket are garments worn on the body. Shoes are footwear.'),

('logic','medium','Which does NOT belong? 8 · 27 · 64 · 100',
 '["8","27","64","100"]','100',
 '8 = 2³, 27 = 3³, 64 = 4³ are perfect cubes. 100 is not a perfect cube.'),

('logic','medium','Book is to Library as Painting is to ___',
 '["Artist","Canvas","Museum","Gallery"]','Museum',
 'Books are stored/displayed in libraries; paintings are stored/displayed in museums.'),

('logic','medium','Doctor is to Hospital as Teacher is to ___',
 '["Classroom","School","Degree","Student"]','School',
 'A doctor works in a hospital; a teacher works in a school.'),

('logic','medium','Fish is to Water as Bird is to ___',
 '["Feathers","Nest","Air","Tree"]','Air',
 'Fish live/move in water; birds live/move through air.'),

('logic','medium','Clock is to Time as Thermometer is to ___',
 '["Heat","Temperature","Weather","Fever"]','Temperature',
 'A clock measures time; a thermometer measures temperature.'),

('logic','medium','Pen is to Write as Knife is to ___',
 '["Sharp","Cut","Metal","Cook"]','Cut',
 'A pen is used to write; a knife is used to cut.'),

('logic','medium','Cup is to Drink as Plate is to ___',
 '["Cook","Eat","Wash","Serve"]','Eat',
 'You use a cup to drink from; you use a plate to eat from.'),

('logic','medium','Seed is to Flower as Egg is to ___',
 '["Shell","Chick","Nest","Feather"]','Chick',
 'A seed grows into a flower; an egg hatches into a chick.'),

('logic','medium','A cube has 6 faces, 12 edges, and how many vertices?',
 '["6","7","8","12"]','8',
 'A cube has 8 corner points (vertices).'),

('logic','medium','If you fold a square piece of paper in half twice, how many layers are there?',
 '["2","3","4","8"]','4',
 'Each fold doubles the layers: 1 → 2 → 4.'),

('logic','medium','How many triangles are in a shape made by drawing all 3 diagonals of a regular hexagon?',
 '["4","6","8","12"]','6',
 'Drawing all 3 long diagonals of a regular hexagon creates 6 equilateral triangles.'),

('logic','medium','A 3×3 grid of squares — how many squares are there in total (including overlapping sizes)?',
 '["9","12","14","16"]','14',
 '9 (1×1) + 4 (2×2) + 1 (3×3) = 14 squares.'),

('logic','medium','If a clock shows 3:00, what is the angle between the hour and minute hands?',
 '["60°","75°","90°","120°"]','90°',
 'At 3:00, the minute hand points to 12 and the hour hand to 3 — exactly 90° apart.'),

('logic','medium','P is true and Q is false. What is the truth value of "P AND Q"?',
 '["True","False","Unknown","Depends on context"]','False',
 'AND is only true when both operands are true. Since Q is false, P AND Q is false.'),

('logic','medium','P is false and Q is false. What is "P OR Q"?',
 '["True","False","Unknown","True only if P is true"]','False',
 'OR is false only when both operands are false.'),

('logic','medium','What is NOT (NOT P)?',
 '["P","NOT P","True","False"]','P',
 'Double negation cancels out: NOT(NOT P) = P.'),

('logic','medium','P → Q is false. What must be true about P and Q?',
 '["P is false","Q is true","P is true and Q is false","P is false and Q is true"]','P is true and Q is false',
 'An implication P → Q is only false when P is true and Q is false.'),

('logic','medium','Which is logically equivalent to "If A then B"?',
 '["If B then A","If not A then not B","If not B then not A","A and B"]','If not B then not A',
 '"If not B then not A" is the contrapositive, which is always equivalent to the original implication.'),

('logic','medium','There are 5 people in a room. Each shakes hands with every other person once. How many handshakes total?',
 '["8","10","12","15"]','10',
 'Combinations: C(5,2) = 5×4/2 = 10 handshakes.'),

('logic','medium','A farmer has 17 sheep. All but 9 die. How many sheep are left?',
 '["8","9","17","0"]','9',
 '"All but 9" means 9 survive.'),

('logic','medium','A clock gains 5 minutes every hour. If set correctly at 8:00 am, what time does it show at 12:00 noon (true time)?',
 '["12:00","12:15","12:20","12:25"]','12:20',
 'In 4 real hours, the clock gains 4×5 = 20 minutes, so it shows 12:20.'),

('logic','medium','Three friends — Amy, Ben, Carol — each pick a different number from 1, 2, 3. Amy does not pick 1. Ben picks a higher number than Carol. What does Amy pick?',
 '["1","2","3","Cannot be determined"]','2',
 'Ben > Carol rules out Ben=1. Amy ≠ 1. Only solution: Ben=3, Carol=1, Amy=2.'),

('logic','medium','You are in a race and overtake the person in 2nd place. What place are you in now?',
 '["1st","2nd","3rd","4th"]','2nd',
 'You took their spot — 2nd place. You would need to pass 1st place to be 1st.'),

('logic','medium','A snail climbs 3 m up a 10 m wall each day and slips back 2 m each night. On which day does it reach the top?',
 '["7th","8th","9th","10th"]','8th',
 'Net gain = 1 m/day. After 7 days it is at 7 m. On day 8 it climbs 3 m, reaching 10 m before night.'),

('logic','medium','What comes next? Circle, Triangle, Square, Circle, Triangle, Square, Circle, __',
 '["Circle","Triangle","Square","Pentagon"]','Triangle',
 'The pattern repeats every 3 shapes: Circle, Triangle, Square.'),

('logic','medium','What comes next? A, C, E, G, __',
 '["H","I","J","K"]','I',
 'Every other letter of the alphabet: A(1), C(3), E(5), G(7), I(9).'),

('logic','medium','What letter is missing? B, D, G, K, __',
 '["N","O","P","Q"]','P',
 'Gaps increase by 1: +2(D), +3(G), +4(K), +5 → P (16th letter).'),

('logic','medium','Which number replaces the "?" in the sequence: 2, 6, 12, 20, 30, ?',
 '["40","42","44","48"]','42',
 'Differences: 4,6,8,10,12 → next is 30+12 = 42.'),

('logic','medium','What comes next in the pattern? 1, 4, 9, 16, 25, __',
 '["30","34","36","49"]','36',
 'These are perfect squares: 1²,2²,3²,4²,5²,6² = 36.'),

('logic','medium','Complete the analogy: 3 is to 9 as 5 is to ___',
 '["10","15","20","25"]','25',
 '3² = 9 and 5² = 25. The relationship is squaring.'),

('logic','medium','In the series 1, 2, 4, 7, 11, 16, what is the next number?',
 '["20","21","22","23"]','22',
 'Differences: 1,2,3,4,5 → next difference is 6 → 16+6 = 22.'),

('logic','medium','If RED = 27 and BLUE = 40, what does GREEN equal? (Sum of alphabetical positions)',
 '["49","52","57","59"]','49',
 'G(7)+R(18)+E(5)+E(5)+N(14) = 49.'),

('logic','medium','A box contains red and blue marbles. The ratio is 3:5. If there are 24 red marbles, how many blue marbles are there?',
 '["32","36","40","48"]','40',
 'If 3 parts = 24, then 1 part = 8. Blue = 5 × 8 = 40.'),

('logic','medium','Which shape has the most lines of symmetry?',
 '["Equilateral triangle","Square","Regular pentagon","Circle"]','Circle',
 'A circle has infinite lines of symmetry — any diameter is a line of symmetry.');
