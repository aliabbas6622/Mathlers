from typing import Dict, Any

class ProgressionService:
    """
    CORE PLATFORM LOGIC: PROGRESSION
    Handles ELO calculations, Belt ranks, and Mastery logic.
    """

    BELTS = [
        {"name": "White", "min_elo": 0},
        {"name": "Yellow", "min_elo": 500},
        {"name": "Green", "min_elo": 1000},
        {"name": "Blue", "min_elo": 1500},
        {"name": "Red", "min_elo": 2000},
        {"name": "Black", "min_elo": 2500},
        {"name": "Champion", "min_elo": 3000}
    ]

    def calculate_elo_change(self, player_elo: int, opponent_elo: int, won: bool, k_factor: int = 32) -> int:
        """Standard ELO calculation."""
        expected_score = 1 / (1 + 10 ** ((opponent_elo - player_elo) / 400))
        actual_score = 1 if won else 0
        return round(k_factor * (actual_score - expected_score))

    def get_belt_for_elo(self, elo: int) -> str:
        """Returns the belt name for a given ELO."""
        for belt in reversed(self.BELTS):
            if elo >= belt["min_elo"]:
                return belt["name"]
        return "White"

    def calculate_mastery_gain(self, current_mastery: float, correct: bool, difficulty: str) -> float:
        """Calculates how much mastery is gained or lost."""
        multipliers = {"easy": 0.5, "medium": 1.0, "hard": 2.0, "expert": 5.0}
        gain = multipliers.get(difficulty, 1.0)

        if correct:
            new_mastery = current_mastery + gain
        else:
            new_mastery = current_mastery - (gain * 0.5)

        return max(0.0, min(100.0, new_mastery))
