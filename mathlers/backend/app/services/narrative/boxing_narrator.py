from typing import Dict, Any, List
import random

class BoxingNarrator:
    """
    AI NARRATIVE LAYER
    Story framing and boxing theme narrative.
    ONLY for storytelling, NOT for math.
    """

    ROUNDS = {
        "warm_up": "Warmup Round",
        "jab": "Jab Round",
        "hook": "Hook Round",
        "uppercut": "Uppercut Round",
        "knockout": "Knockout Round"
    }

    SCENARIOS = [
        "The crowd is roaring as you step into the ring for the {round_name}!",
        "Your opponent looks tough, but your math skills are sharper. It's the {round_name}!",
        "Dodge the swing and counter with a calculation! Welcome to the {round_name}.",
        "The championship belt is within reach. Focus for the {round_name}!",
        "Lights flash, cameras roll. It's time for the {round_name} showdown."
    ]

    MOTIVATIONS = [
        "Think like a champion!",
        "Speed and accuracy win belts!",
        "Float like a butterfly, calculate like a machine!",
        "One punch at a time, one math problem at a time.",
        "The ring is yours!"
    ]

    def frame_question(self, blueprint: Dict[str, Any], round_type: str = "warm_up") -> str:
        """Adds boxing narrative to a question blueprint."""
        round_name = self.ROUNDS.get(round_type, "Practice Round")
        scenario = random.choice(self.SCENARIOS).format(round_name=round_name)
        motivation = random.choice(self.MOTIVATIONS)

        category = blueprint.get('category', 'world records')

        narrative = f"🥊 **{round_name.upper()}** 🥊\n\n"
        narrative += f"{scenario}\n\n"
        narrative += f"In the high-stakes world of {category}...\n\n"
        narrative += f"{blueprint['question_text']}\n\n"
        narrative += f"🔥 *{motivation}*"

        return narrative

    def generate_step_by_step_narrative(self, solver_log: List[str]) -> str:
        """Wraps deterministic solver logs in narrative."""
        framed_log = "📖 **CHAMPION'S PLAYBOOK (Step-by-Step)**\n\n"
        for i, step in enumerate(solver_log, 1):
            framed_log += f"Step {i}: {step}\n"
        return framed_log
