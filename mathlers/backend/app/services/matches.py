from typing import List, Dict, Any

class MatchService:
    """
    CORE PLATFORM LOGIC: MATCHES
    Handles score orchestration, round multipliers, and match flow.
    """

    ROUND_MULTIPLIERS = {
        "warm_up": 1.0,
        "jab": 1.2,
        "hook": 1.5,
        "uppercut": 2.0,
        "knockout": 3.0
    }

    def calculate_question_score(self, base_points: int, round_type: str, time_taken: float, time_limit: int) -> int:
        """Calculates final score for a question with speed bonus and round multiplier."""
        multiplier = self.ROUND_MULTIPLIERS.get(round_type, 1.0)

        # Speed bonus: up to 50% extra if answered in first 10% of time
        speed_ratio = max(0, 1 - (time_taken / time_limit))
        speed_bonus = 1 + (speed_ratio * 0.5)

        return round(base_points * speed_bonus * multiplier)

    def determine_match_winner(self, players: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Identifies the winner and calculates rewards."""
        winner = max(players, key=lambda p: p['score'])
        return {
            "winner_id": winner['user_id'],
            "final_scores": {p['user_id']: p['score'] for p in players}
        }
