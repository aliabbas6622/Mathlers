from typing import Dict, Any, List
from datetime import datetime
import random

class MasteryEngine:
    """
    DIFFICULTY & MASTERY ENGINE
    Implements student modeling and dynamic difficulty adaptation.
    """

    def __init__(self):
        # In-memory storage for demo; production would use database
        self.student_models = {}

    def get_student_model(self, student_id: int) -> Dict[str, Any]:
        """Retrieves or initializes a student model."""
        if student_id not in self.student_models:
            self.student_models[student_id] = {
                "student_id": student_id,
                "topic_accuracy": {}, # {topic: accuracy_rate}
                "topic_attempts": {},
                "avg_speed_per_topic": {},
                "overall_mastery": 0.0,
                "improvement_trend": 0.0,
                "weak_areas": [],
                "current_level": "beginner",
                "history": [] # List of (question_id, correct, time_taken, topic)
            }
        return self.student_models[student_id]

    def update_mastery(self, student_id: int, result: Dict[str, Any]):
        """
        Updates student model based on a question result.
        result: {question_id, correct, time_taken, topic}
        """
        model = self.get_student_model(student_id)
        topic = result['topic']
        correct = result['correct']
        time_taken = result['time_taken']

        # Update topic stats
        attempts = model['topic_attempts'].get(topic, 0) + 1
        model['topic_attempts'][topic] = attempts

        current_acc = model['topic_accuracy'].get(topic, 0.0)
        model['topic_accuracy'][topic] = (current_acc * (attempts - 1) + (1.0 if correct else 0.0)) / attempts

        # Update speed
        current_speed = model['avg_speed_per_topic'].get(topic, 0.0)
        model['avg_speed_per_topic'][topic] = (current_speed * (attempts - 1) + time_taken) / attempts

        # Record history
        model['history'].append(result)
        if len(model['history']) > 100:
            model['history'].pop(0)

        # Re-calculate weak areas
        model['weak_areas'] = [t for t, acc in model['topic_accuracy'].items() if acc < 0.7]

        # Update current level based on overall accuracy
        total_attempts = sum(model['topic_attempts'].values())
        if total_attempts > 0:
            overall_acc = sum(acc * model['topic_attempts'][t] for t, acc in model['topic_accuracy'].items()) / total_attempts
            model['overall_mastery'] = overall_acc

            if overall_acc > 0.9 and total_attempts > 50:
                model['current_level'] = "advanced"
            elif overall_acc > 0.7 and total_attempts > 20:
                model['current_level'] = "intermediate"
            else:
                model['current_level'] = "beginner"

    def select_difficulty(self, student_id: int, topic: str) -> str:
        """Adapts difficulty dynamically based on mastery of the topic."""
        model = self.get_student_model(student_id)
        accuracy = model['topic_accuracy'].get(topic, 0.5) # Default 0.5 for new topics

        if accuracy > 0.85:
            return "hard"
        elif accuracy > 0.6:
            return "medium"
        else:
            return "easy"

    def recommend_next_topic(self, student_id: int) -> str:
        """Personalizes practice sets by selecting weak areas or new topics."""
        model = self.get_student_model(student_id)
        if model['weak_areas']:
            return random.choice(model['weak_areas'])

        # Default to a general topic or one with fewest attempts
        topics = list(model['topic_attempts'].keys())
        if not topics:
             return "percentages" # Default starting topic

        return min(model['topic_attempts'], key=model['topic_attempts'].get)
