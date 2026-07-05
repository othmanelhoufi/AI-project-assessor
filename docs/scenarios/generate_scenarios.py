import json

# Load the data
with open('data/categories.json') as f: categories = json.load(f)
with open('data/rules.json') as f: rules = json.load(f)
with open('data/technologies.json') as f: technologies = json.load(f)
with open('data/roles.json') as f: roles = json.load(f)

assessment_data = {
    'technologies': technologies,
    'roles': roles,
    'rules': rules
}

# Helper: find option effects
def get_effects(question_id, value):
    for cat in categories:
        for q in cat.get('questions', []):
            if q['id'] == question_id:
                for opt in q.get('options', []):
                    if opt['value'] == value:
                        return opt.get('effects', {})
    return {}

def check_rule_conditions(conditions, answers):
    for question_id, expected_values in conditions.items():
        user_answer = answers.get(question_id)
        if not user_answer or user_answer not in expected_values:
            return False
    return True

def apply_effects(result, effects, assessment_data):
    if 'techProfileId' in effects:
        techProfile = assessment_data['technologies'].get(effects['techProfileId'])
        if techProfile:
            result['techProfile'].update(techProfile)
            
    if 'roleIds' in effects:
        for roleId in effects['roleIds']:
            if roleId in assessment_data['roles']:
                result['roles'][roleId] = assessment_data['roles'][roleId]
                
    if 'eta' in effects:
        if 'addMin' in effects['eta']: result['eta']['min'] += effects['eta']['addMin']
        if 'addMax' in effects['eta']: result['eta']['max'] += effects['eta']['addMax']
        
    if 'eta_multiplier' in effects:
        result['eta']['min'] = round(result['eta']['min'] * effects['eta_multiplier'], 1)
        result['eta']['max'] = round(result['eta']['max'] * effects['eta_multiplier'], 1)
        
    if 'feasibility' in effects:
        result['feasibility'].update(effects['feasibility'])
        
    if 'scope_title' in effects:
        result['scope_title'] = effects['scope_title']
        
    if 'warnings' in effects:
        warns = effects['warnings'] if isinstance(effects['warnings'], list) else [effects['warnings']]
        result['warnings'].extend(warns)
        
    if 'avoidTech' in effects:
        avoids = effects['avoidTech'] if isinstance(effects['avoidTech'], list) else [effects['avoidTech']]
        result['avoidTech'].extend(avoids)

def run_assessment(answers):
    result = {
      'techProfile': {},
      'roles': {},
      'eta': { 'min': 2, 'max': 4 },
      'feasibility': { 'risk': "Medium", 'confidence': "Medium" },
      'warnings': [],
      'avoidTech': [],
      'scope_title': "Project"
    }
    
    # Apply direct effects
    for qid, val in answers.items():
        eff = get_effects(qid, val)
        if eff:
            apply_effects(result, eff, assessment_data)
            
    # Apply rules
    for rule in assessment_data['rules']:
        if check_rule_conditions(rule['conditions'], answers):
            apply_effects(result, rule['effects'], assessment_data)
            
    return result

def print_result(title, result):
    print(f"\n## {title}")
    print(f"**Feasibility:** Risk: {result['feasibility'].get('risk')}, Confidence: {result['feasibility'].get('confidence')}")
    print(f"**ETA:** {result['eta']['min']} - {result['eta']['max']} months ({result['scope_title']})")
    
    if result['warnings']:
        print("**Warnings:**")
        for w in result['warnings']:
            print(f"- {w}")
            
    if result['avoidTech']:
        print("**Avoid Technologies:**")
        for t in result['avoidTech']:
            print(f"- {t}")
            
    print("**Tech Profile Guidance:**")
    for k, v in result['techProfile'].items():
        if k not in ['Category', 'summary']:
            print(f"- {k}: {v}")
            
    print("**Recommended Roles:**")
    for rid, role in result['roles'].items():
        print(f"- {role['title']} ({role.get('allocation', 'N/A')} allocation)")

# --- SCENARIOS ---

# UC1: Churn Prediction / Customer Retention
# French Insurance: Structured data (CRM, claims), predicting churn (classification), likely large data, high accuracy, strict regulations
uc1_answers = {
    'primary_problem': 'classification',
    'project_scope': 'mvp',
    'data_type': 'structured',
    'data_labeling': 'fully_labeled',
    'data_volume': '100k_plus_rec',
    'data_freshness': 'monthly', # batch is fine for churn
    'data_pii': 'yes',
    'accuracy_req': 'high',
    'explainability': 'critical', # Important for insurance pricing/retention
    'multi_lingual': 'no',
    'operational_req': 'standard_hours',
    'kpi': 'revenue', # or csat
    'budget': '50k_200k',
    'team_expertise': 'some_analytics',
    'maintenance': 'static', # Let's say they want a static model first
    'error_impact': 'moderate',
    'error_type_bias': 'fn_critical', # Better to flag someone as churn risk and give a discount than lose them
    'regulatory': 'strict'
}

# UC2: Automated Customer Interaction (Text + Audio)
# French Insurance: Emails, client area messages, SVI (IVR) transcription -> Mixed data, NLP + Audio, High availability, Multi-lingual (maybe just French, but could be multi-regional), High budget, Real-time
uc2_answers = {
    'primary_problem': 'nlp', # We'll pick NLP as primary, but mixed data
    'project_scope': 'production',
    'data_type': 'mixed', # Text + Audio
    'data_labeling': 'partially_labeled',
    'data_volume': 'massive_tb',
    'data_freshness': 'realtime',
    'data_pii': 'yes',
    'accuracy_req': 'high',
    'explainability': 'important',
    'multi_lingual': 'no', # Let's stick to French for simplicity, or maybe multi_lingual if they cover Europe
    'operational_req': 'high_availability', # Needs to be up 24/7 for customer service
    'kpi': 'cost', # Reducing operational costs
    'budget': 'over_500k',
    'team_expertise': 'yes_expert',
    'maintenance': 'automated_retraining',
    'error_impact': 'significant', # Bad customer experience if it fails
    'error_type_bias': 'fp_critical', # Don't want to automate a wrong action
    'regulatory': 'strict'
}

# UC3: Internal Knowledge Management / RAG
# French Insurance: Internal docs, policies, contracts -> Unstructured text, Search/RAG, moderate accuracy (human in loop), internal tool
uc3_answers = {
    'primary_problem': 'information_retrieval',
    'project_scope': 'mvp',
    'data_type': 'unstructured_text',
    'data_labeling': 'not_applicable',
    'data_volume': '1k_100k_rec', # Number of documents
    'data_freshness': 'weekly_monthly',
    'data_pii': 'yes', # Internal docs might have client examples
    'accuracy_req': 'moderate', # Internal tool
    'explainability': 'important',
    'multi_lingual': 'no',
    'operational_req': 'standard_hours',
    'kpi': 'csat', # Internal employee satisfaction/efficiency
    'budget': '50k_200k',
    'team_expertise': 'some_analytics',
    'maintenance': 'client_mlops',
    'error_impact': 'low', # Internal user can double check
    'error_type_bias': 'equal',
    'regulatory': 'moderate'
}

print("Generating Scenarios...")
print_result("UC1: Customer Churn Prediction (Classification)", run_assessment(uc1_answers))
print_result("UC2: Automated Customer Interactions (NLP + Audio)", run_assessment(uc2_answers))
print_result("UC3: Internal Knowledge Management (RAG)", run_assessment(uc3_answers))

