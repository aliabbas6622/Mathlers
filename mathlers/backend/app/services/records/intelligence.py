from typing import Dict, Any, Optional, List
from datetime import datetime
import re

class RecordIntelligence:
    """
    RECORD INTELLIGENCE LAYER
    Normalizes raw data, handles units, and detects anomalies.
    """

    UNIT_MAPPING = {
        'dollars': 'USD',
        '$': 'USD',
        'percent': '%',
        'percentage': '%',
        'sec': 'seconds',
        's': 'seconds',
        'm': 'minutes',
        'min': 'minutes',
        'h': 'hours',
        'hr': 'hours',
    }

    @staticmethod
    def normalize_unit(unit: str) -> str:
        if not unit:
            return ""
        unit_lower = unit.lower().strip()
        return RecordIntelligence.UNIT_MAPPING.get(unit_lower, unit_lower)

    @staticmethod
    def to_canonical_value(value: Any) -> float:
        """Converts various value formats to a canonical float."""
        if isinstance(value, (int, float)):
            return float(value)

        if isinstance(value, str):
            # Remove currency symbols, commas, and other non-numeric chars except .
            clean_val = re.sub(r'[^\d.]', '', value)
            try:
                return float(clean_val)
            except ValueError:
                raise ValueError(f"Cannot convert '{value}' to a numeric canonical form.")

        raise ValueError(f"Unsupported value type: {type(value)}")

    @staticmethod
    def detect_anomalies(data: Dict[str, Any]) -> List[str]:
        """Detects potential data issues or anomalies."""
        anomalies = []

        value = data.get('value')
        prev_value = data.get('previous_value')

        if value is not None and prev_value is not None:
            # Simple anomaly check: if value is 10x or 0.1x of previous value, flag it
            # This is a heuristic and can be tuned
            if prev_value != 0:
                ratio = value / prev_value
                if ratio > 10 or ratio < 0.1:
                    anomalies.append(f"Significant value jump detected: {prev_value} -> {value}")

        if value is None:
            anomalies.append("Record value is missing")

        if not data.get('title'):
            anomalies.append("Record title is missing")

        return anomalies

    def create_record_card(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Normalizes raw data into a Record Card schema."""

        try:
            canonical_value = self.to_canonical_value(raw_data.get('value'))
            prev_value = raw_data.get('previous_value')
            canonical_prev_value = self.to_canonical_value(prev_value) if prev_value is not None else None

            unit = self.normalize_unit(raw_data.get('unit', ''))

            record_card = {
                "id": raw_data.get('id'),
                "title": raw_data.get('title'),
                "value": canonical_value,
                "unit": unit,
                "previous_value": canonical_prev_value,
                "category": raw_data.get('category'),
                "subcategory": raw_data.get('subcategory'),
                "date": raw_data.get('date', datetime.utcnow()),
                "source_url": raw_data.get('source_url'),
                "verified": raw_data.get('verified', False),
                "version": raw_data.get('version', 1)
            }

            anomalies = self.detect_anomalies(record_card)
            if anomalies:
                # In a real system, we might log these or flag the record for human review
                record_card['anomalies'] = anomalies
                record_card['verified'] = False

            return record_card

        except Exception as e:
            raise ValueError(f"Normalization failed: {str(e)}")

    def update_record(self, current_record: Dict[str, Any], new_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handles record updates and versioning."""
        updated_record = current_record.copy()

        # Increment version if value changes
        if self.to_canonical_value(new_data.get('value')) != current_record['value']:
            updated_record['previous_value'] = current_record['value']
            updated_record['version'] = current_record.get('version', 1) + 1
            updated_record['value'] = self.to_canonical_value(new_data['value'])
            updated_record['date'] = datetime.utcnow()
            updated_record['verified'] = False # Re-verify on change

        # Update other fields
        for field in ['title', 'category', 'subcategory', 'source_url', 'unit']:
            if field in new_data:
                updated_record[field] = new_data[field]

        return updated_record
