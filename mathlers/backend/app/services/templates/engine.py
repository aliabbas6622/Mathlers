from typing import Dict, Any, List, Optional
import random

class TemplateEngine:
    """
    QUESTION TEMPLATE ENGINE
    Generates question blueprints from Record Cards using deterministic templates.
    """

    def __init__(self):
        self.templates = self._initialize_templates()

    def _initialize_templates(self) -> List[Dict[str, Any]]:
        templates = []

        # 1-10: Percentage Increase/Decrease Templates
        for i in range(1, 11):
            templates.append({
                "id": f"perc_{i}",
                "type": "percentage_change",
                "difficulty_tags": ["easy", "medium"] if i < 6 else ["hard"],
                "math_operation": "percentage_change",
                "required_fields": ["value", "previous_value"],
                "blueprint": {
                    "question_template": "By what percentage did the new record of {value} {unit} exceed the previous record of {previous_value} {unit}?",
                    "inputs": ["value", "previous_value"]
                }
            })

        # 11-20: Ratio Comparison Templates
        for i in range(1, 11):
            templates.append({
                "id": f"ratio_{i}",
                "type": "ratio_comparison",
                "difficulty_tags": ["medium"],
                "math_operation": "ratio",
                "required_fields": ["value", "previous_value"],
                "blueprint": {
                    "question_template": "What is the simplified ratio between the current record ({value}) and the previous record ({previous_value})?",
                    "inputs": ["value", "previous_value"]
                }
            })

        # 21-25: Speed/Time/Distance Templates
        for i in range(1, 6):
            templates.append({
                "id": f"speed_{i}",
                "type": "speed_calculation",
                "difficulty_tags": ["easy", "medium"],
                "math_operation": "speed",
                "required_fields": ["value"], # Value here might be time for a fixed distance
                "blueprint": {
                    "question_template": "If the distance is 100 meters and the time is {value} {unit}, what was the average speed?",
                    "inputs": ["value"]
                }
            })

        # 26-30: Statistics Templates (Mean)
        for i in range(1, 6):
            templates.append({
                "id": f"stats_{i}",
                "type": "statistics_mean",
                "difficulty_tags": ["medium", "hard"],
                "math_operation": "average",
                "required_fields": ["value", "previous_value"],
                "blueprint": {
                    "question_template": "What is the average of the current record {value} and the previous record {previous_value}?",
                    "inputs": ["value", "previous_value"]
                }
            })

        # 31-35: Algebra Templates
        for i in range(1, 6):
            templates.append({
                "id": f"algebra_{i}",
                "type": "algebra_problem",
                "difficulty_tags": ["hard"],
                "math_operation": "algebra",
                "required_fields": ["value"],
                "blueprint": {
                    "question_template": "Solve for x if x + {value} = 100",
                    "inputs": ["value"]
                }
            })

        return templates

    def get_templates_for_record(self, record: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Finds all templates compatible with the given record card."""
        compatible = []
        for t in self.templates:
            if all(field in record and record[field] is not None for field in t["required_fields"]):
                compatible.append(t)
        return compatible

    def generate_blueprint(self, record: Dict[str, Any], template_id: Optional[str] = None) -> Dict[str, Any]:
        """Creates a question blueprint from a record and a template."""
        compatible = self.get_templates_for_record(record)
        if not compatible:
            raise ValueError(f"No compatible templates found for record {record.get('id')}")

        template = None
        if template_id:
            template = next((t for t in compatible if t["id"] == template_id), None)

        if not template:
            template = random.choice(compatible)

        # Variable Injection
        blueprint = {
            "template_id": template["id"],
            "math_operation": template["math_operation"],
            "question_text": f"**{record['title']}**\n\n" + template["blueprint"]["question_template"].format(**record),
            "inputs": {k: record[k] for k in template["blueprint"]["inputs"]},
            "record_id": record["id"],
            "category": record["category"],
            "unit": record["unit"]
        }

        return blueprint
