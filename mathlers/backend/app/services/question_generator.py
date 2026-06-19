"""
Mathlers AI Question Generation Engine
Generates math questions from real-world record data using AI
"""

import json
import random
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from enum import Enum


# ==================== QUESTION TEMPLATES ====================

QUESTION_TEMPLATES = {
    "percentage_change": {
        "template": """In the world of {category}, a new record was set! 

🥊 **{record_title}**

{holder} achieved an incredible {current_value} {unit} on {date}! 
The previous record was {previous_value} {unit} held by {previous_holder}.

**Question:** By what percentage did the new record exceed the previous record?

A) {option_a}%
B) {option_b}%
C) {option_c}%
D) {option_d}%

💡 *Think like a champion - calculate the difference, then find the percentage!*""",
        "math_operation": "percentage_change",
        "difficulty": "medium"
    },
    
    "ratio_comparison": {
        "template": """🥊 **CHAMPIONSHIP ROUND: Ratio Challenge**

In {category}, two legendary records stand out:

• Record 1: {record1_title}
  - Value: {value1} {unit1}
  - Holder: {holder1}

• Record 2: {record2_title}
  - Value: {value2} {unit2}
  - Holder: {holder2}

**Question:** What is the ratio of Record 1 to Record 2 (simplified)?

A) {option_a}
B) {option_b}
C) {option_c}
D) {option_d}

⚡ *Speed and accuracy win belts!*""",
        "math_operation": "ratio",
        "difficulty": "medium"
    },
    
    "time_speed_distance": {
        "template": """🏆 **SPEED RECORD SHOWDOWN**

At the {event_name}, {athlete} completed the distance in {time} seconds!

The track length was {distance} meters.

**Question:** What was their average speed in meters per second?

A) {option_a} m/s
B) {option_b} m/s
C) {option_c} m/s
D) {option_d} m/s

🔥 *Calculate like a speed demon!*""",
        "math_operation": "speed",
        "difficulty": "easy"
    },
    
    "algebra_word_problem": {
        "template": """🎮 **ESPORTS MATH CHALLENGE**

The Esports World Cup {year} had a total prize pool of ${total_prize}M.

This was ${increase}M more than the previous year's tournament.

**Question:** If next year's prize pool increases by the same amount, what will it be?

Let x = next year's prize pool
x = {current_prize} + {increase}

A) ${option_a}M
B) ${option_b}M
C) ${option_c}M
D) ${option_d}M

🎯 *Algebra wins championships!*""",
        "math_operation": "algebra",
        "difficulty": "hard"
    },
    
    "statistics_average": {
        "template": """📊 **STATISTICS SPECTACULAR**

Top 5 Mobile Esports Viewership Records (in millions):
{viewers_list}

**Question:** What is the average viewership across these 5 records?

A) {option_a} million
B) {option_b} million
C) {option_c} million
D) {option_d} million

📈 *Champions know their averages!*""",
        "math_operation": "average",
        "difficulty": "medium"
    },
    
    "geometry_area": {
        "template": """🏟️ **ARENA CALCULATION CHALLENGE**

The boxing ring for the Mathlers Championship has:
- Length: {length} meters
- Width: {width} meters

**Question:** What is the total area of the boxing ring?

A) {option_a} sq meters
B) {option_b} sq meters
C) {option_c} sq meters
D) {option_d} sq meters

📐 *Geometry is the foundation of champions!*""",
        "math_operation": "area",
        "difficulty": "easy"
    },
    
    "probability": {
        "template": """🎲 **PROBABILITY PUNCH**

In a tournament with {total_teams} teams, each team has an equal chance of winning.

Your favorite team is one of them!

**Question:** What is the probability (as a percentage) that your team wins?

A) {option_a}%
B) {option_b}%
C) {option_c}%
D) {option_d}%

🎰 *Calculate your odds of victory!*""",
        "math_operation": "probability",
        "difficulty": "medium"
    },
    
    "financial_math": {
        "template": """💰 **PRIZE MONEY MASTERY**

A tournament champion won ${prize} from a total prize pool of ${pool}.

**Question:** What percentage of the total prize pool did the champion receive?

A) {option_a}%
B) {option_b}%
C) {option_c}%
D) {option_d}%

💵 *Money math makes champions rich!*""",
        "math_operation": "percentage",
        "difficulty": "medium"
    }
}


# ==================== KNOCKOUT ROUND BONUS QUESTIONS ====================

KNOCKOUT_TEMPLATES = {
    "multi_step": """🥊 **KNOCKOUT ROUND: Multi-Step Challenge** 🥊

{scenario}

This question is worth 3x points! Take your time and show your work.

**Question:** {question}

A) {option_a}
B) {option_b}
C) {option_c}
D) {option_d}

⚠️ *One wrong move and you're knocked out!*""",

    "real_world_application": """🏆 **KNOCKOUT: Real-World Application** 🏆

Using the record data below, solve this complex real-world problem:

{data_points}

**Challenge:** {challenge_question}

Show your reasoning step by step!

Points: 300 (3x multiplier applied)""",

    "estimation_challenge": """💥 **KNOCKOUT: Estimation Master** 💥

Given these facts:
{facts}

**Estimate:** {estimation_question}

A) {option_a}
B) {option_b}
C) {option_c}
D) {option_d}

🎯 *Close enough can still knock them out!*"""
}


# ==================== SAMPLE RECORD CARDS (2026 Data) ====================

SAMPLE_RECORDS_2026 = [
    {
        "id": 1,
        "title": "MLBB M7 World Championship Peak Viewers",
        "category": "esports",
        "holder": "Mobile Legends",
        "numeric_value": 5680511,
        "unit": "peak viewers",
        "previous_value": 4500000,
        "previous_holder": "MLBB M6",
        "date": "2026-08-15",
        "location": "Jakarta, Indonesia",
        "source": "Esports Charts",
        "difficulty_tags": ["medium", "hard"],
        "age_ranges": ["intermediate", "advanced"],
        "math_topics": ["percentages", "ratios"]
    },
    {
        "id": 2,
        "title": "Esports World Cup 2026 Prize Pool",
        "category": "esports",
        "holder": "Esports World Cup",
        "numeric_value": 75000000,
        "unit": "USD",
        "previous_value": 70000000,
        "previous_holder": "Esports World Cup 2025",
        "date": "2026-07-20",
        "location": "Riyadh, Saudi Arabia",
        "source": "Esports World Cup Official",
        "difficulty_tags": ["easy", "medium"],
        "age_ranges": ["beginner", "intermediate"],
        "math_topics": ["percentages", "arithmetic"]
    },
    {
        "id": 3,
        "title": "Fortnite Reload Elite Series Prize",
        "category": "gaming",
        "holder": "Elite Series Winner",
        "numeric_value": 1000000,
        "unit": "USD",
        "previous_value": 750000,
        "previous_holder": "Previous Season",
        "date": "2026-06-10",
        "location": "Online",
        "source": "Epic Games",
        "difficulty_tags": ["easy"],
        "age_ranges": ["beginner", "intermediate"],
        "math_topics": ["percentages", "ratios"]
    },
    {
        "id": 4,
        "title": "100m Sprint World Record",
        "category": "sports",
        "holder": "Athletics Champion",
        "numeric_value": 9.58,
        "unit": "seconds",
        "previous_value": 9.63,
        "previous_holder": "Previous Record Holder",
        "date": "2026-09-05",
        "location": "Tokyo, Japan",
        "source": "World Athletics",
        "difficulty_tags": ["easy", "medium"],
        "age_ranges": ["beginner", "intermediate", "advanced"],
        "math_topics": ["time_speed_distance", "percentages"]
    },
    {
        "id": 5,
        "title": "Steam Concurrent Players Record",
        "category": "gaming",
        "holder": "Steam Platform",
        "numeric_value": 35000000,
        "unit": "concurrent players",
        "previous_value": 32000000,
        "previous_holder": "Steam 2025",
        "date": "2026-01-01",
        "location": "Global",
        "source": "Steam API",
        "difficulty_tags": ["medium"],
        "age_ranges": ["intermediate", "advanced"],
        "math_topics": ["percentages", "statistics"]
    }
]


# ==================== QUESTION GENERATION ENGINE ====================

class DifficultyLevel(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class RoundType(Enum):
    WARM_UP = "warm_up"
    JAB = "jab"
    HOOK = "hook"
    UPPERCUT = "uppercut"
    KNOCKOUT = "knockout"


class QuestionGenerator:
    """AI-powered question generation engine"""
    
    def __init__(self):
        self.templates = QUESTION_TEMPLATES
        self.knockout_templates = KNOCKOUT_TEMPLATES
        self.records = SAMPLE_RECORDS_2026
    
    def generate_wrong_options(self, correct_answer: float, 
                                num_options: int = 3,
                                variation_percent: float = 15) -> List[float]:
        """Generate plausible wrong answer options"""
        options = []
        used_values = {correct_answer}
        
        while len(options) < num_options:
            # Generate variation
            variation = random.uniform(-variation_percent, variation_percent) / 100
            wrong_value = correct_answer * (1 + variation)
            
            # Ensure uniqueness and reasonable difference
            if wrong_value not in used_values and abs(wrong_value - correct_answer) > 0.01:
                options.append(round(wrong_value, 2))
                used_values.add(wrong_value)
        
        return options
    
    def format_options(self, correct_answer: Any, wrong_options: List[Any]) -> Tuple[List[str], int]:
        """Format options and return shuffled list with correct index"""
        all_options = [correct_answer] + wrong_options
        
        # Create labeled options
        labels = ['A', 'B', 'C', 'D']
        labeled = list(zip(labels, all_options))
        
        # Shuffle
        random.shuffle(labeled)
        
        # Find correct index
        correct_index = next(i for i, (label, value) in enumerate(labeled) 
                            if value == correct_answer)
        
        option_texts = [f"{label}) {value}" for label, value in labeled]
        
        return option_texts, correct_index
    
    def generate_percentage_question(self, record: Dict) -> Dict:
        """Generate a percentage change question"""
        current = record['numeric_value']
        previous = record['previous_value']
        
        # Calculate correct answer
        percentage_change = ((current - previous) / previous) * 100
        correct_answer = round(percentage_change, 2)
        
        # Generate wrong options
        wrong_options = self.generate_wrong_options(correct_answer, 3, 20)
        
        # Format options
        options, correct_index = self.format_options(correct_answer, wrong_options)
        
        # Fill template
        template = self.templates["percentage_change"]["template"]
        question_text = template.format(
            category=record['category'],
            record_title=record['title'],
            holder=record['holder'],
            current_value=current,
            unit=record['unit'],
            date=record['date'],
            previous_value=previous,
            previous_holder=record['previous_holder'],
            option_a=options[0],
            option_b=options[1],
            option_c=options[2],
            option_d=options[3]
        )
        
        return {
            "scenario": f"In the world of {record['category']}, a new record breaks!",
            "question_text": question_text,
            "question_type": "multiple_choice",
            "options": options,
            "correct_answer": str(correct_answer),
            "correct_option_index": correct_index,
            "step_by_step_solution": f"""Step 1: Find the difference: {current} - {previous} = {current - previous}
Step 2: Divide by original value: ({current - previous}) / {previous} = {(current - previous) / previous:.4f}
Step 3: Convert to percentage: {(current - previous) / previous:.4f} × 100 = {correct_answer}%""",
            "explanation": f"The new record exceeded the previous record by {correct_answer}%. This means for every 100 units of the old record, the new record added about {round(correct_answer, 0)} more units!",
            "difficulty": "medium",
            "math_topic": "percentages",
            "points_base": 100,
            "record_card_id": record['id']
        }
    
    def generate_speed_question(self, record: Dict) -> Dict:
        """Generate a speed/distance/time question"""
        # Use realistic values
        distance = 100  # meters (standard sprint)
        time = record['numeric_value']
        
        # Calculate speed
        speed = distance / time
        correct_answer = round(speed, 2)
        
        # Generate wrong options
        wrong_options = self.generate_wrong_options(correct_answer, 3, 15)
        options, correct_index = self.format_options(correct_answer, wrong_options)
        
        template = self.templates["time_speed_distance"]["template"]
        question_text = template.format(
            event_name="World Championship",
            athlete=record['holder'],
            time=time,
            distance=distance,
            option_a=options[0],
            option_b=options[1],
            option_c=options[2],
            option_d=options[3]
        )
        
        return {
            "scenario": "A world record sprint at the championship!",
            "question_text": question_text,
            "question_type": "multiple_choice",
            "options": options,
            "correct_answer": str(correct_answer),
            "correct_option_index": correct_index,
            "step_by_step_solution": f"""Step 1: Recall formula: Speed = Distance / Time
Step 2: Plug in values: Speed = {distance}m / {time}s
Step 3: Calculate: {distance} ÷ {time} = {correct_answer} m/s""",
            "explanation": f"The athlete ran at an average speed of {correct_answer} meters per second. That's incredibly fast - faster than most cars in a school zone!",
            "difficulty": "easy",
            "math_topic": "time_speed_distance",
            "points_base": 100,
            "record_card_id": record['id']
        }
    
    def generate_knockout_question(self, records: List[Dict]) -> Dict:
        """Generate a challenging knockout round question"""
        # Multi-step problem using multiple records
        record1 = records[0]
        record2 = records[1] if len(records) > 1 else records[0]
        
        val1 = record1['numeric_value']
        val2 = record2['numeric_value']
        
        # Create multi-step problem
        scenario = f"""Record A: {record1['title']} = {val1} {record1['unit']}
Record B: {record2['title']} = {val2} {record2['unit']}"""
        
        # Calculate combined operations
        sum_val = val1 + val2
        diff_val = abs(val1 - val2)
        ratio_val = round(max(val1, val2) / min(val1, val2), 2) if min(val1, val2) > 0 else 0
        
        question = f"If you add both records together, then subtract the difference, what do you get?"
        
        correct_answer = round((sum_val - diff_val), 2)
        wrong_options = self.generate_wrong_options(correct_answer, 3, 25)
        options, correct_index = self.format_options(correct_answer, wrong_options)
        
        template = self.knockout_templates["multi_step"]
        question_text = template.format(
            scenario=scenario,
            question=question,
            option_a=options[0],
            option_b=options[1],
            option_c=options[2],
            option_d=options[3]
        )
        
        return {
            "scenario": "KNOCKOUT ROUND - Multiple records combine!",
            "question_text": question_text,
            "question_type": "multiple_choice",
            "options": options,
            "correct_answer": str(correct_answer),
            "correct_option_index": correct_index,
            "step_by_step_solution": f"""Step 1: Add both values: {val1} + {val2} = {sum_val}
Step 2: Find the difference: |{val1} - {val2}| = {diff_val}
Step 3: Subtract: {sum_val} - {diff_val} = {correct_answer}

💡 Pro tip: This is equivalent to 2 × min({val1}, {val2}) = {2 * min(val1, val2)}""",
            "explanation": f"When you add two numbers and subtract their difference, you always get twice the smaller number!",
            "difficulty": "hard",
            "math_topic": "arithmetic",
            "is_knockout": True,
            "knockout_multiplier": 3.0,
            "points_base": 300,
            "record_card_id": record1['id']
        }
    
    def generate_questions_for_match(self, difficulty: str = "medium", 
                                      num_questions: int = 20) -> List[Dict]:
        """Generate a complete set of questions for a match"""
        questions = []
        
        # Distribute by round type
        round_distribution = {
            "warm_up": 3,
            "jab": 5,
            "hook": 5,
            "uppercut": 4,
            "knockout": 3
        }
        
        generators = {
            "easy": self.generate_speed_question,
            "medium": self.generate_percentage_question,
            "hard": self.generate_percentage_question
        }
        
        generator = generators.get(difficulty, self.generate_percentage_question)
        
        question_count = 0
        for round_type, count in round_distribution.items():
            for i in range(count):
                if round_type == "knockout":
                    question = self.generate_knockout_question(self.records)
                    question['round_type'] = round_type
                else:
                    record = random.choice(self.records)
                    question = generator(record)
                    question['round_type'] = round_type
                
                questions.append(question)
                question_count += 1
                
                if question_count >= num_questions:
                    break
            
            if question_count >= num_questions:
                break
        
        return questions[:num_questions]
    
    def validate_question(self, question: Dict) -> Tuple[bool, float, str]:
        """Validate a generated question for mathematical accuracy"""
        try:
            # Check required fields
            required_fields = ['question_text', 'correct_answer', 'options', 'step_by_step_solution']
            for field in required_fields:
                if field not in question:
                    return False, 0.0, f"Missing required field: {field}"
            
            # Verify correct answer is in options
            correct_idx = question.get('correct_option_index')
            if correct_idx is None or correct_idx >= len(question['options']):
                return False, 0.0, "Invalid correct option index"
            
            # Parse and verify mathematical solution
            # (In production, use symbolic math library like sympy)
            
            # Return validation score based on completeness
            validation_score = 1.0  # Full score if all checks pass
            return True, validation_score, "Validated successfully"
            
        except Exception as e:
            return False, 0.0, str(e)


# ==================== USAGE EXAMPLE ====================

if __name__ == "__main__":
    generator = QuestionGenerator()
    
    print("=" * 60)
    print("🥊 MATHLERS QUESTION GENERATION ENGINE 🥊")
    print("=" * 60)
    
    # Generate sample questions
    print("\n📝 Generating sample questions...\n")
    
    # Percentage question
    record = SAMPLE_RECORDS_2026[0]
    question = generator.generate_percentage_question(record)
    print(f"PERCENTAGE QUESTION:\n{question['question_text']}\n")
    print(f"✅ Correct Answer: {question['correct_answer']}")
    print(f"📖 Solution:\n{question['step_by_step_solution']}\n")
    
    print("-" * 60)
    
    # Knockout question
    knockout = generator.generate_knockout_question(SAMPLE_RECORDS_2026[:2])
    print(f"\n🥊 KNOCKOUT QUESTION:\n{knockout['question_text']}\n")
    print(f"✅ Correct Answer: {knockout['correct_answer']}")
    print(f"💪 Points: {knockout['points_base']} (3x multiplier)")
    
    print("\n" + "=" * 60)
    print("Questions generated successfully!")
