"""
Validation JSON Schema pour les données utilisateur
Validation stricte des structures de données
"""
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime


class JSONSchemaValidator:
    """
    Validateur JSON Schema pour les structures de données
    """
    
    def __init__(self):
        self.schemas = self._load_schemas()
    
    def _load_schemas(self) -> Dict[str, Dict[str, Any]]:
        """Charger les schémas JSON Schema"""
        return {
            'category': {
                'type': 'object',
                'required': ['id', 'name', 'target'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1, 'maxLength': 100},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'target': {'type': 'number', 'minimum': 0, 'maximum': 10000000},
                    'monthlyTargets': {
                        'type': 'array',
                        'items': {'type': 'number', 'minimum': 0},
                        'minItems': 0,
                        'maxItems': 12
                    }
                }
            },
            'expense': {
                'type': 'object',
                'required': ['id', 'categoryId', 'amount', 'date'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'categoryId': {'type': 'string', 'minLength': 1},
                    'amount': {'type': 'number', 'minimum': 0, 'maximum': 10000000},
                    'date': {'type': 'string', 'pattern': r'^\d{4}-\d{2}-\d{2}$'},
                    'description': {'type': 'string', 'maxLength': 500},
                    'month': {'type': 'integer', 'minimum': 1, 'maximum': 12},
                    'share': {'$ref': '#/definitions/expenseShare'}
                }
            },
            'subscription': {
                'type': 'object',
                'required': ['id', 'name', 'monthly'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'monthly': {'type': 'number', 'minimum': 0, 'maximum': 10000000},
                    'startMonth': {'type': 'integer', 'minimum': 1, 'maximum': 12},
                    'endMonth': {'type': 'integer', 'minimum': 1, 'maximum': 12},
                    'ongoing': {'type': 'boolean'},
                    'accountId': {'type': 'string'},
                    'share': {'$ref': '#/definitions/expenseShare'}
                }
            },
            'annualFixedExpense': {
                'type': 'object',
                'required': ['id', 'name', 'amount'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'amount': {'type': 'number', 'minimum': 0, 'maximum': 10000000},
                    'month': {'type': 'integer', 'minimum': 1, 'maximum': 12},
                    'accountId': {'type': 'string'},
                    'share': {'$ref': '#/definitions/expenseShare'}
                }
            },
            'bankAccount': {
                'type': 'object',
                'required': ['id', 'name', 'currentBalance'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'currentBalance': {'type': 'number', 'minimum': -10000000, 'maximum': 100000000},
                    'accountType': {'type': 'string', 'enum': ['checking', 'savings', 'investment', 'other']}
                }
            },
            'savingsGoal': {
                'type': 'object',
                'required': ['id', 'name', 'targetAmount', 'currentAmount'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'targetAmount': {'type': 'number', 'minimum': 0, 'maximum': 100000000},
                    'currentAmount': {'type': 'number', 'minimum': 0, 'maximum': 100000000},
                    'accountId': {'type': 'string'}
                }
            },
            'savingsProject': {
                'type': 'object',
                'required': ['id', 'name', 'targetAmount', 'currentAmount', 'targetDate'],
                'properties': {
                    'id': {'type': 'string', 'minLength': 1},
                    'name': {'type': 'string', 'minLength': 1, 'maxLength': 200},
                    'targetAmount': {'type': 'number', 'minimum': 0, 'maximum': 100000000},
                    'currentAmount': {'type': 'number', 'minimum': 0, 'maximum': 100000000},
                    'targetDate': {'type': 'string', 'pattern': r'^\d{4}-\d{2}-\d{2}$'},
                    'monthlyContribution': {'type': 'number', 'minimum': 0, 'maximum': 10000000}
                }
            },
            'yearData': {
                'type': 'object',
                'properties': {
                    'categories': {
                        'type': 'array',
                        'items': {'$ref': '#/definitions/category'}
                    },
                    'expenses': {
                        'type': 'array',
                        'items': {'$ref': '#/definitions/expense'}
                    },
                    'subs': {
                        'type': 'array',
                        'items': {'$ref': '#/definitions/subscription'}
                    },
                    'annualFixedExpenses': {
                        'type': 'array',
                        'items': {'$ref': '#/definitions/annualFixedExpense'}
                    },
                    'monthlySalary': {'type': 'number', 'minimum': 0, 'maximum': 10000000},
                    'currentSavings': {'type': 'number', 'minimum': 0, 'maximum': 100000000}
                }
            }
        }
    
    def validate(self, schema_name: str, data: Any) -> Tuple[bool, Optional[List[str]]]:
        """
        Valider des données selon un schéma
        
        Args:
            schema_name: Nom du schéma à utiliser
            data: Données à valider
            
        Returns:
            Tuple (is_valid, errors_list)
        """
        if schema_name not in self.schemas:
            return False, [f"Schéma '{schema_name}' introuvable"]
        
        schema = self.schemas[schema_name]
        errors = []
        
        # Validation basique selon le schéma
        if schema.get('type') == 'object':
            if not isinstance(data, dict):
                return False, ["Les données doivent être un objet"]
            
            # Vérifier les champs requis
            required = schema.get('required', [])
            for field in required:
                if field not in data:
                    errors.append(f"Champ requis manquant: {field}")
            
            # Valider les propriétés
            properties = schema.get('properties', {})
            for field, value in data.items():
                if field in properties:
                    field_schema = properties[field]
                    field_errors = self._validate_field(field, value, field_schema)
                    errors.extend(field_errors)
        
        elif schema.get('type') == 'array':
            if not isinstance(data, list):
                return False, ["Les données doivent être un tableau"]
            
            items_schema = schema.get('items', {})
            min_items = schema.get('minItems', 0)
            max_items = schema.get('maxItems', None)
            
            if len(data) < min_items:
                errors.append(f"Le tableau doit contenir au moins {min_items} éléments")
            
            if max_items and len(data) > max_items:
                errors.append(f"Le tableau ne peut pas contenir plus de {max_items} éléments")
            
            for i, item in enumerate(data):
                item_errors = self._validate_field(f"item[{i}]", item, items_schema)
                errors.extend(item_errors)
        
        return len(errors) == 0, errors if errors else None
    
    def _validate_field(self, field_name: str, value: Any, schema: Dict[str, Any]) -> List[str]:
        """Valider un champ selon son schéma"""
        errors = []
        field_type = schema.get('type')
        
        # Validation de type
        if field_type == 'string':
            if not isinstance(value, str):
                errors.append(f"{field_name}: doit être une chaîne de caractères")
            else:
                min_length = schema.get('minLength')
                max_length = schema.get('maxLength')
                if min_length and len(value) < min_length:
                    errors.append(f"{field_name}: doit contenir au moins {min_length} caractères")
                if max_length and len(value) > max_length:
                    errors.append(f"{field_name}: ne peut pas contenir plus de {max_length} caractères")
                
                pattern = schema.get('pattern')
                if pattern:
                    import re
                    if not re.match(pattern, value):
                        errors.append(f"{field_name}: format invalide")
        
        elif field_type == 'number':
            if not isinstance(value, (int, float)):
                errors.append(f"{field_name}: doit être un nombre")
            else:
                minimum = schema.get('minimum')
                maximum = schema.get('maximum')
                if minimum is not None and value < minimum:
                    errors.append(f"{field_name}: doit être >= {minimum}")
                if maximum is not None and value > maximum:
                    errors.append(f"{field_name}: doit être <= {maximum}")
        
        elif field_type == 'integer':
            if not isinstance(value, int):
                errors.append(f"{field_name}: doit être un entier")
            else:
                minimum = schema.get('minimum')
                maximum = schema.get('maximum')
                if minimum is not None and value < minimum:
                    errors.append(f"{field_name}: doit être >= {minimum}")
                if maximum is not None and value > maximum:
                    errors.append(f"{field_name}: doit être <= {maximum}")
        
        elif field_type == 'boolean':
            if not isinstance(value, bool):
                errors.append(f"{field_name}: doit être un booléen")
        
        elif field_type == 'array':
            if not isinstance(value, list):
                errors.append(f"{field_name}: doit être un tableau")
            else:
                items_schema = schema.get('items', {})
                for i, item in enumerate(value):
                    item_errors = self._validate_field(f"{field_name}[{i}]", item, items_schema)
                    errors.extend(item_errors)
        
        elif field_type == 'object':
            if not isinstance(value, dict):
                errors.append(f"{field_name}: doit être un objet")
            else:
                # Valider les propriétés de l'objet
                properties = schema.get('properties', {})
                for prop, prop_value in value.items():
                    if prop in properties:
                        prop_errors = self._validate_field(f"{field_name}.{prop}", prop_value, properties[prop])
                        errors.extend(prop_errors)
        
        # Validation enum
        enum_values = schema.get('enum')
        if enum_values and value not in enum_values:
            errors.append(f"{field_name}: doit être l'une des valeurs: {', '.join(map(str, enum_values))}")
        
        return errors
    
    def validate_year_data(self, data: Dict[str, Any]) -> Tuple[bool, Optional[List[str]]]:
        """Valider les données d'une année complète"""
        return self.validate('yearData', data)
    
    def validate_category(self, data: Dict[str, Any]) -> Tuple[bool, Optional[List[str]]]:
        """Valider une catégorie"""
        return self.validate('category', data)
    
    def validate_expense(self, data: Dict[str, Any]) -> Tuple[bool, Optional[List[str]]]:
        """Valider une dépense"""
        return self.validate('expense', data)
    
    def validate_subscription(self, data: Dict[str, Any]) -> Tuple[bool, Optional[List[str]]]:
        """Valider un abonnement"""
        return self.validate('subscription', data)


def create_validator() -> JSONSchemaValidator:
    """Créer une instance du validateur"""
    return JSONSchemaValidator()

