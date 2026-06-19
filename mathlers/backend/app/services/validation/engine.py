from typing import Dict, Any, List, Tuple
import hashlib
import json

class ValidationEngine:
    """
    VALIDATION ENGINE
    Every generated question MUST pass through here.
    """

    def __init__(self, solver):
        self.solver = solver
        self.question_hashes = set()

    def _generate_question_hash(self, question: Dict[str, Any]) -> str:
        """Generates a unique hash for a question to detect duplicates."""
        # Hash based on record_id, template_id and inputs
        data = {
            "record_id": question.get("record_id"),
            "template_id": question.get("template_id"),
            "inputs": question.get("inputs")
        }
        return hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

    def validate_question(self, question: Dict[str, Any], computed_result: Dict[str, Any]) -> Tuple[bool, str]:
        """
        4-step validation:
        Step 1: Recompute answer from raw inputs (implicit as it's passed in)
        Step 2: Compare with generated answer
        Step 3: Verify MCQ options correctness
        Step 4: Reject duplicates using hashing
        """

        # Step 1 & 2: Compare answers
        if str(question['correct_answer']) != str(computed_result['exact_answer']):
             return False, f"Answer mismatch: generated={question['correct_answer']}, computed={computed_result['exact_answer']}"

        # Step 3: Verify MCQ options
        options = question.get('options', [])
        if options:
            # Ensure correct answer is in options
            if str(question['correct_answer']) not in [str(o) for o in options]:
                return False, "Correct answer not found in MCQ options"

            # Ensure options are unique
            if len(set(options)) != len(options):
                return False, "Duplicate MCQ options detected"

            # Ensure no option is 'None' or empty
            if any(o is None or str(o).strip() == "" for o in options):
                return False, "Invalid MCQ option detected"

        # Step 4: Reject duplicates
        q_hash = self._generate_question_hash(question)
        if q_hash in self.question_hashes:
            return False, "Duplicate question detected (hash match)"

        self.question_hashes.add(q_hash)

        return True, "Success"

    def recompute_and_verify(self, blueprint: Dict[str, Any], question: Dict[str, Any]) -> bool:
        """Fully recomputes the answer from blueprint inputs and verifies against question."""
        op = blueprint['math_operation']
        inputs = blueprint['inputs']

        try:
            if op == 'percentage_change':
                res = self.solver.solve_percentage_change(inputs['value'], inputs['previous_value'])
            elif op == 'ratio':
                res = self.solver.solve_ratio(inputs['value'], inputs['previous_value'])
            elif op == 'speed':
                res = self.solver.solve_speed(100, inputs['value']) # Assuming fixed 100m for now
            elif op == 'average':
                res = self.solver.solve_average([inputs['value'], inputs['previous_value']])
            elif op == 'algebra':
                res = self.solver.solve_algebra(f"x + {inputs['value']} = 100")
            else:
                return False

            is_valid, reason = self.validate_question(question, res)
            if not is_valid:
                print(f"Validation failed: {reason}")
                return False
            return True

        except Exception as e:
            print(f"Validation error: {str(e)}")
            return False
