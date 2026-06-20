from typing import Dict, Any, List, Optional
import random
from .records.intelligence import RecordIntelligence
from .templates.engine import TemplateEngine
from .solver.engine import DeterministicSolver
from .validation.engine import ValidationEngine
from .mastery.engine import MasteryEngine
from .narrative.boxing_narrator import BoxingNarrator

class MathlersEngine:
    """
    CORE ENGINE PIPELINE
    Orchestrates the 5-layer system to generate production-grade questions.
    """

    def __init__(self):
        self.records_layer = RecordIntelligence()
        self.template_layer = TemplateEngine()
        self.solver_layer = DeterministicSolver()
        self.validation_layer = ValidationEngine(self.solver_layer)
        self.mastery_layer = MasteryEngine()
        self.narrative_layer = BoxingNarrator()

    def generate_question(self, raw_record: Dict[str, Any], student_id: int, round_type: str = "warm_up") -> Optional[Dict[str, Any]]:
        """
        The correct flow:
        Record Card -> Template Selection -> Variable Injection ->
        Deterministic Solver -> Validation Engine -> AI Narrative Layer
        """

        # 1. Record Intelligence Layer
        record_card = self.records_layer.create_record_card(raw_record)

        # 2 & 5. Difficulty Selection (from Mastery Layer)
        # For simplicity in this demo, we assume the record matches the student's needs
        # or we could filter templates based on mastery.

        # 3. Template Selection & Variable Injection (Template Engine)
        try:
            blueprint = self.template_layer.generate_blueprint(record_card)
        except ValueError:
            return None # No compatible template

        # 4. Deterministic Math Solver
        op = blueprint['math_operation']
        inputs = blueprint['inputs']

        try:
            if op == 'percentage_change':
                solution = self.solver_layer.solve_percentage_change(inputs['value'], inputs['previous_value'])
            elif op == 'ratio':
                solution = self.solver_layer.solve_ratio(inputs['value'], inputs['previous_value'])
            elif op == 'speed':
                solution = self.solver_layer.solve_speed(100, inputs['value']) # Fixed 100m for sprint
            elif op == 'average':
                solution = self.solver_layer.solve_average([inputs['value'], inputs['previous_value']])
            elif op == 'algebra':
                solution = self.solver_layer.solve_algebra(f"x + {inputs['value']} = 100")
            else:
                return None
        except Exception as e:
            print(f"Solver error: {e}")
            return None

        # Prepare MCQ Options
        correct_answer = solution['exact_answer']
        options = self._generate_options(correct_answer, op)

        # Create tentative question object for validation
        question = {
            "record_id": record_card['id'],
            "template_id": blueprint['template_id'],
            "inputs": inputs,
            "correct_answer": correct_answer,
            "options": options,
            "math_topic": op
        }

        # 5. Validation Engine
        is_valid, reason = self.validation_layer.validate_question(question, solution)
        if not is_valid:
            print(f"Validation failed: {reason}")
            return None

        # 6. AI Narrative Layer
        final_text = self.narrative_layer.frame_question(blueprint, round_type)
        step_by_step = self.narrative_layer.generate_step_by_step_narrative(solution['step_by_step'])

        # Final Question Output
        return {
            "boxing_round": self.narrative_layer.ROUNDS.get(round_type, "Warmup"),
            "scenario": "AI-generated narrative", # Placeholder, actually part of final_text
            "question_text": final_text,
            "options": options,
            "correct_answer": str(correct_answer),
            "formatted_answer": solution['formatted_answer'],
            "step_by_step_solution": step_by_step,
            "difficulty": "medium", # TBD by mastery
            "record_card_id": record_card['id'],
            "math_topic": op
        }

    def _generate_options(self, correct_answer: Any, op: str) -> List[str]:
        """Generates MCQ options including the correct one."""
        options = {str(correct_answer)}

        # Simple wrong answer generation
        if isinstance(correct_answer, (int, float)):
            attempts = 0
            while len(options) < 4 and attempts < 100:
                attempts += 1
                # Try a mix of offsets and absolute changes
                if random.random() > 0.5:
                    offset = random.uniform(0.5, 1.5)
                    wrong = round(float(correct_answer) * offset, 2)
                else:
                    wrong = round(float(correct_answer) + random.randint(-100, 100), 2)

                if str(wrong) not in options and str(wrong).strip() != "":
                    options.add(str(wrong))
        elif isinstance(correct_answer, tuple): # Ratio
            v1, v2 = correct_answer
            attempts = 0
            while len(options) < 4 and attempts < 100:
                attempts += 1
                w1 = max(1, v1 + random.randint(-5, 5))
                w2 = max(1, v2 + random.randint(-5, 5))
                wrong = f"{w1}:{w2}"
                if wrong not in options:
                    options.add(wrong)

        # Fallback if we still don't have enough options
        fallback_attempts = 0
        while len(options) < 4 and fallback_attempts < 100:
            fallback_attempts += 1
            wrong = str(random.randint(1, 1000))
            if wrong not in options:
                options.add(wrong)

        opts_list = list(options)
        random.shuffle(opts_list)
        return opts_list
